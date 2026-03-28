import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, CheckCircle, Database, Globe, Cpu, Link2, Calendar,
  FileText, MessageSquare, Clock, AtSign, Send, Paperclip, Upload, File, Trash2, Download, FileSignature,
  TriangleAlert, Shield, ExternalLink, TrendingDown, BarChart3
} from 'lucide-react';
import { COLUMNS, REGIONS, INDUSTRY_REGULATIONS, FALLBACK_COMPLIANCE_DOCS } from '../config/constants';
import { analyzeRiceCore, runNode1, runNode2 } from '../utils/api';
import RichTextEditor from './RichTextEditor';
import { useProject } from '../context/ProjectContext';
import ComplianceDashboard from './ComplianceDashboard';
import VaultUploader from './VaultUploader';

// --- Tab Definitions ---
const TABS = [
  { id: 'prd', label: 'PRD', icon: FileText },
  { id: 'audit', label: 'Audit Dashboard', icon: Shield },
  { id: 'attachments', label: 'Document Vault', icon: Paperclip },
  { id: 'comments', label: 'Comments & Mentions', icon: MessageSquare },
];

export default function FeatureModal() {
  const {
    selectedFeature, closeModal: onClose, isModalOpen,
    handleFeatureSave: onSave, deleteFeature: onDelete,
    currentUser, backendStatus, backendUrl, apiKeys,
    aiModel, customDocs, epics, features: allFeatures,
    users, vendors, resetForm,
  } = useProject();

  // Stable initial form data — only recompute when selectedFeature changes
  const initialFormData = React.useMemo(
    () => selectedFeature || resetForm(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFeature]
  );

  const [formData, setFormData] = useState(initialFormData);
  const [newComment, setNewComment] = useState('');
  const [mentionUser, setMentionUser] = useState('');
  const [activeTab, setActiveTab] = useState('prd');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isNode1Running, setIsNode1Running] = useState(false);
  const [isNode2Running, setIsNode2Running] = useState(false);
  const [auditVerdict, setAuditVerdict] = useState(null);
  const [agentError, setAgentError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [liveLog, setLiveLog] = useState([]);
  
  // Attestation State
  const [attestationName, setAttestationName] = useState('');
  const [attestChecked, setAttestChecked] = useState(false);

  // Maker-Checker state
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  React.useEffect(() => {
    setFormData(initialFormData);
    setAgentError('');
    setActiveTab('prd');
  }, [initialFormData]);

  if (!isModalOpen) return null;

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const addHistoryEntry = (action, details) => {
    const entry = {
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'System',
      action,
      details,
    };
    setFormData(prev => ({
      ...prev,
      history: [entry, ...(prev.history || [])]
    }));
  };

  const calculateRice = (r, i, c, e) => {
    const effort = parseFloat(e);
    if (!effort || effort === 0) return 0;
    return ((parseFloat(r) * parseFloat(i) * parseFloat(c)) / effort).toFixed(1);
  };

  const toggleDependency = (depId) => {
    setFormData(prev => {
      const deps = prev.dependencies || [];
      const newDeps = deps.includes(depId) ? deps.filter(d => d !== depId) : [...deps, depId];
      return { ...prev, dependencies: newDeps };
    });
  };

  const saveFeature = async () => {
    const rice = calculateRice(formData.reach, formData.impact, formData.confidence, formData.effort);
    const featureId = selectedFeature ? selectedFeature.id : `CYN-${Date.now()}`;
    const updatedFormData = { ...formData, id: featureId, riceScore: rice };
    onSave(updatedFormData, !!selectedFeature);

    if (backendStatus) {
      try {
        await fetch(`${BACKEND_URL}/api/features`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: featureId, title: updatedFormData.title || 'Untitled',
            description: updatedFormData.description || 'No desc',
            region: updatedFormData.region || 'Global', industry: updatedFormData.industry || 'General',
            status: updatedFormData.status || 'Discovery',
            rice_score: parseFloat(rice), compliance_status: updatedFormData.complianceStatus || 'Pending'
          })
        });
      } catch (e) { console.error("Database sync failed", e); }
    }
    return updatedFormData;
  };

  const saveAndClose = async () => {
    addHistoryEntry('Feature saved', `${currentUser?.name || 'User'} saved changes to this feature.`);
    await saveFeature();
    onClose();
  };

  // --- Comments ---
  const handleAddComment = (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;
    const mention = mentionUser ? `@${mentionUser} ` : '';
    const commentText = `${mention}${newComment}`;
    setFormData(prev => ({
      ...prev,
      comments: [{ user: currentUser?.name || 'User', text: String(commentText), timestamp: new Date().toISOString() }, ...(prev.comments || [])]
    }));
    addHistoryEntry('Comment added', `${currentUser?.name || 'User'} posted a comment.`);
    setNewComment('');
    setMentionUser('');
  };

  const handleCommentChange = (val) => {
    setNewComment(val);
    const words = val.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) setMentionUser(lastWord.substring(1));
    else setMentionUser('');
  };

  // --- Document Vault Handlers ---
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (currentUser?.role === 'Engineer') return; // Enforce RBAC
    
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    if (!files.length) return;

    const newAttachments = files.map(file => ({
      id: `doc-${Date.now()}-${file.name}`,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || 'application/octet-stream',
      uploadDate: new Date().toISOString(),
      uploader: currentUser?.name || 'System',
      status: 'Draft',
      rejectReason: ''
    }));

    setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...newAttachments] }));
    addHistoryEntry('Document Uploaded', `${currentUser?.name || 'User'} attached ${files.length} document(s) in Draft state.`);
  };

  const updateAttachmentStatus = (docId, status, reason = '') => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).map(a => 
        a.id === docId ? { ...a, status, rejectReason: reason } : a
      )
    }));
    addHistoryEntry('Document Status Updated', `Document ${docId} moved to ${status}.`);
    if (status === 'Pending Checker Review') {
       // Reset reject states if any
       setRejectingDocId(null);
       setRejectReason('');
    }
  };


  const removeAttachment = (docId) => {
    if (currentUser?.role === 'Engineer') return;
    setFormData(prev => ({
      ...prev, attachments: (prev.attachments || []).filter(a => a.id !== docId)
    }));
    addHistoryEntry('Document Removed', `${currentUser?.name || 'User'} removed an attachment.`);
  };
  // --- Status change with history tracking ---
  const handleStatusChange = (e) => {
    const oldStatus = formData.status;
    const newStatus = e.target.value;
    handleInputChange(e);
    if (oldStatus !== newStatus) {
      addHistoryEntry('Status changed', `${currentUser?.name || 'User'} changed status from "${oldStatus}" to "${newStatus}".`);
    }
  };

  // --- AI AUTO-SCORING ---
  const runInsightEngine = async (e) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setLiveLog(['[SYS] Connecting to Enterprise AI Core...', '[SYS] Initializing RICE evaluation...']);
    setAgentError('');
    addHistoryEntry('AI Auto-Score initiated', `${currentUser?.name || 'User'} triggered RICE auto-scoring.`);

    const logInterval = setInterval(() => {
      setLiveLog(prev => {
        const phrases = ['[AI] Analyzing semantic density...', '[AI] Quantifying business impact...', '[AI] Estimating engineering effort...', '[AI] Running Monte Carlo simulations...'];
        if (prev.length < 6) return [...prev, phrases[prev.length - 2]];
        return prev;
      });
    }, 800);

    try {
      setLiveLog(prev => [...prev, '[AI] Querying FastAPI backend...']);
      const payload = { title: formData.title, description: formData.description, prdText: formData.prdHtml || formData.description, region: formData.region, industry: formData.industry, customDocs: customDocs || '', aiModel: aiModel || 'gemini-2.0-flash' };
      const response = await analyzeRiceCore(payload, apiKeys);
      setLiveLog(prev => [...prev, '[SYS] Scoring complete.']);
      const aiData = response.data || response || { reach: 0, impact: 0, confidence: 0, effort: 0 };
      setFormData(prev => ({ ...prev, reach: aiData.reach, impact: aiData.impact, confidence: aiData.confidence, effort: aiData.effort }));
      addHistoryEntry('AI Auto-Score completed', `Backend scored: R=${aiData.reach} I=${aiData.impact} C=${aiData.confidence} E=${aiData.effort}`);
    } catch(err) {
      clearInterval(logInterval);
      setAgentError(String(err.message || err));
      addHistoryEntry('AI Auto-Score failed', String(err.message));
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setLiveLog([]), 3000);
    }
  };

  // --- NODE 1: Local RAG & Vendor Risk ---
  const runNode1Audit = async () => {
    setIsNode1Running(true);
    setAgentError('');
    setLiveLog(['[SYS] Connecting to Compliance Engine...', '[Node 1] Synchronizing with Pinecone DB...']);
    addHistoryEntry('Node 1 Audit initiated', 'Checking internal policies and third-party vendor risks.');
    await saveFeature();

    try {
      setLiveLog(prev => [...prev, '[Node 1] Awaiting API response from localhost:8000...']);
      const payload = { project_description: `${formData.title}\n\n${formData.description || ''}` };
      const response = await runNode1(payload, apiKeys);
      
      const result = response.data || response;
      const compStatus = result.status === 'Pass' ? 'Pending Web Intel' : result.status === 'degraded' ? formData.complianceStatus : 'Blocked';
      setLiveLog(prev => [...prev, `[SYS] Node 1 API Return: ${result.status}`]);
      
      setFormData(prev => ({
        ...prev,
        complianceStatus: compStatus,
        comments: [
          { user: 'Compliance Engine (Node 1)', text: `[${result.status}] Framework: ${result.framework || 'N/A'} | Rule: ${result.rule_violated || 'N/A'}`, timestamp: new Date().toISOString() },
          ...(prev.comments || [])
        ]
      }));
      setAuditVerdict({ node: 'Node 1', ...result });
      addHistoryEntry('Node 1 Audit completed', `Result: ${result.status}. ${result.title}`);
    } catch (error) {
      setAgentError('');
      setAuditVerdict({
        node: 'Node 1',
        status: 'SYSTEM OFFLINE',
        title: 'Connection Failed',
        overview: 'Unable to reach the Cynapse AI Core.',
        engine: 'System Error',
        detailedAnalysis: 'Please ensure the Python FastAPI server is running on localhost:8000 and CORS is configured.',
        citations: []
      });
      addHistoryEntry('Node 1 Audit failed', error.message);
    } finally {
      setIsNode1Running(false);
      setTimeout(() => setLiveLog([]), 3000);
    }
  };

  // --- NODE 2: GLOBAL WEB INTEL ---
  const runNode2Audit = async () => {
    setIsNode2Running(true);
    setAgentError('');
    setLiveLog(['[SYS] Connecting to Compliance Engine...', '[Node 2] Initiating SerpAPI Web Intel...']);
    addHistoryEntry('Node 2 Audit initiated', 'System started global regulatory sentiment check.');
    await saveFeature();

    const logInterval = setInterval(() => {
      setLiveLog(prev => {
        const phrases = [
          '[Node 2] Scanning Twitter feeds...',
          '[Node 2] Cross-referencing Facebook & Instagram sentiments...',
          '[Node 2] Scanning global news channels and Quora threads...',
          '[Node 2] Parsing Reddit (r/privacy, r/fintech)...',
          '[Node 2] Analyzing transcripts from global conferences...',
          '[AI] Calculating sentiment score...',
          '[AI] Synthesizing final decision...'
        ];
        if (prev.length < 9) return [...prev, phrases[Math.min(prev.length - 2, phrases.length - 1)]];
        return prev;
      });
    }, 700);

    try {
      setLiveLog(prev => [...prev, '[Node 2] Awaiting API response from localhost:8000...']);
      const payload = { project_description: `${formData.title}\n\n${formData.description || ''}` };
      const response = await runNode2(payload, apiKeys);
      
      const result = response.data || response;
      setLiveLog(prev => [...prev, `[SYS] Node 2 API Return: ${result.status}`]);
      
      setFormData(prev => ({
        ...prev, complianceStatus: result.status === 'degraded' ? prev.complianceStatus : 'Approved',
        comments: [
          { user: 'Compliance Engine (Node 2)', text: `[${result.status}] ${result.summary || result.message || 'Global risk check complete'}`, timestamp: new Date().toISOString() },
          ...(prev.comments || [])
        ]
      }));
      setAuditVerdict({ node: 'Node 2', ...result });
      addHistoryEntry('Node 2 Audit completed', `Result: ${result.status}. Sentiment: ${result.sentimentScore || 'N/A'}`);
    } catch (error) {
      setAgentError('');
      setAuditVerdict({
        node: 'Node 2',
        status: 'SYSTEM OFFLINE',
        title: 'Connection Failed',
        overview: 'Unable to reach the Cynapse AI Core.',
        engine: 'System Error',
        detailedAnalysis: 'Please ensure the Python FastAPI server is running on localhost:8000 and CORS is configured.',
        sources: [],
        findings: []
      });
      addHistoryEntry('Node 2 Audit failed', error.message);
    } finally {
      setIsNode2Running(false); 
      setTimeout(() => setLiveLog([]), 3000);
    }
  };

  const signAttestation = () => {
    if (!attestationName.trim() || !attestChecked) return;
    setFormData(prev => ({
      ...prev,
      attestation: {
        signed: true,
        name: attestationName.trim(),
        timestamp: new Date().toISOString(),
        ip: '192.168.1.' + Math.floor(Math.random() * 255)
      }
    }));
    addHistoryEntry('Policy Attestation Signed', `Engineer ${attestationName.trim()} digitally attested to compliance constraints.`);
  };

  const linkableFeatures = (allFeatures || []).filter(f => f.id !== formData.id && f.id !== selectedFeature?.id);
  const selectedEpic = (epics || []).find(e => e.id === formData.epicId);
  const allUsers = users || [];

  const generateComplianceReport = async () => {
    try {
      const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
      await import('jspdf-autotable');

      const doc = new jsPDF();
      const reportTitle = 'Cynapse Enterprise Compliance Report';
      const riceScore = calculateRice(formData.reach, formData.impact, formData.confidence, formData.effort);
      const verdict = auditVerdict?.status || formData.complianceStatus || 'Pending';
      const verdictText = auditVerdict?.overview || auditVerdict?.recommendation || 'No AI audit summary available.';
      const citations = [
        ...(auditVerdict?.source_citations || []),
        ...(auditVerdict?.citations || []),
      ];

      doc.setFontSize(16);
      doc.text(reportTitle, 14, 18);
      doc.setFontSize(10);
      doc.text(`Feature ID: ${formData.id || 'N/A'}`, 14, 26);
      doc.text(`Feature: ${formData.title || 'Untitled Initiative'}`, 14, 32);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

      doc.autoTable({
        startY: 46,
        head: [['Metric', 'Value']],
        body: [
          ['RICE Score', String(riceScore)],
          ['Compliance Verdict', String(verdict)],
          ['Framework', String(auditVerdict?.framework || 'N/A')],
          ['Rule / Finding', String(auditVerdict?.rule_violated || auditVerdict?.summary || 'N/A')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [36, 56, 156] },
        styles: { fontSize: 10 },
      });

      const summaryY = (doc.lastAutoTable?.finalY || 72) + 8;
      doc.setFontSize(11);
      doc.text('AI Audit Summary', 14, summaryY);
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(String(verdictText), 180), 14, summaryY + 6);

      const citationRows = citations.length > 0
        ? citations.map((c) => [
            String(c.source || c.name || 'Unknown Source'),
            String(c.page_number || c.page || '-'),
            String(c.section_name || c.section || '-'),
          ])
        : [['No citations available', '-', '-']];

      const citationY = summaryY + 28;
      doc.autoTable({
        startY: citationY,
        head: [['Source', 'Page', 'Section']],
        body: citationRows,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 9 },
      });

      doc.save(`compliance-report-${formData.id || 'feature'}.pdf`);
      addHistoryEntry('Compliance Report Generated', `PDF report exported for ${formData.id || 'feature'}.`);
    } catch (error) {
      setAgentError(`Failed to generate compliance report: ${String(error?.message || error)}`);
    }
  };

  // --- Format timestamp for display ---
  const formatTime = (ts) => {
    if (!ts) return 'Recently';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Recently'; }
  };

  const degradedBackendReason = String(
    auditVerdict?.message ||
    auditVerdict?.error ||
    auditVerdict?.detail ||
    auditVerdict?.detailedAnalysis ||
    auditVerdict?.summary ||
    ''
  ).trim();
  const degradedSignals = `${String(auditVerdict?.status || '')} ${degradedBackendReason}`.toLowerCase();
  const isQuotaDegraded = ['429', 'resource_exhausted', 'quota'].some((token) =>
    degradedSignals.includes(token)
  );

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ backgroundColor: 'rgba(15, 23, 42, 0)', backdropFilter: 'blur(0px)' }}
      animate={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}
      exit={{ backgroundColor: 'rgba(15, 23, 42, 0)', backdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-5xl h-full shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderLeft: '1px solid rgba(226, 232, 240, 0.6)',
        }}
        initial={{ x: '100%', opacity: 0, scale: 0.96 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: '80%', opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1"><CheckCircle size={12} className="text-blue-600"/> {selectedFeature ? selectedFeature.id : 'NEW'}</span>
            {selectedEpic && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: selectedEpic.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: selectedEpic.color }}></span> {selectedEpic.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 transition-colors"><X size={20}/></button>
        </div>

        {/* Title */}
        <div className="px-8 pt-6 pb-2 shrink-0">
          <input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} className="w-full text-2xl font-semibold outline-none bg-transparent text-slate-900 dark:text-white" placeholder="Initiative Summary" />
        </div>

        {/* Tab Bar */}
        <div className="px-8 border-b border-slate-200 dark:border-slate-800 flex gap-1 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.id === 'comments' ? (formData.comments?.length || 0) : tab.id === 'history' ? (formData.history?.length || 0) : null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon size={14} /> {tab.label}
                {badge > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{badge}</span>}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex gap-6 bg-white dark:bg-slate-900 custom-scrollbar">
          {/* Main Content */}
          <div className="flex-1 p-8 space-y-6">

            {/* ==== TAB: PRD ==== */}
            {activeTab === 'prd' && (
              <>
                {/* Rich Text PRD Editor */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileText size={14} /> Product Requirement Document
                  </h3>
                  <RichTextEditor
                    value={formData.description || ''}
                    onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                    placeholder="Write your full PRD here — use headings, lists, tables..."
                  />
                  <div className="flex justify-end mt-2">
                    {currentUser?.role !== 'Engineer' && (
                      <button onClick={runInsightEngine} disabled={isAnalyzing} className="bg-slate-800 dark:bg-slate-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
                        {isAnalyzing ? 'Analyzing...' : <><Zap size={12} className="text-yellow-400" /> Auto-Score (AI)</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-Node Audit System */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">Multi-Node Audit System</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Status: <strong className={formData.complianceStatus === 'Blocked' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}>{formData.complianceStatus}</strong></p>
                    </div>
                    {backendStatus ? (
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900/50">Enterprise Server</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded border border-amber-200 dark:border-amber-900/50">Local Sandbox</span>
                    )}
                  </div>
                  {agentError && <div className="text-xs p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded border border-red-200 dark:border-red-900/50 mb-4">{String(agentError)}</div>}
                  
                  {/* LIVE LOG OVERLAY */}
                  {(isAnalyzing || isNode1Running || isNode2Running) && (
                    <div className="mb-4 bg-slate-900 border border-slate-700 rounded-lg p-3 w-full h-32 overflow-y-auto font-mono text-[10px] text-green-400">
                      {liveLog.map((log, i) => (
                        <div key={i} className="mb-1 animate-fade-in">&gt; {log}</div>
                      ))}
                      <div className="animate-pulse">&gt; _</div>
                    </div>
                  )}

                  {/* ====== DRATA-STYLE AUDIT RESULTS ====== */}
                  {auditVerdict && (
                    <div className="grid md:grid-cols-3 gap-3">
                      {String(auditVerdict.status || '').toLowerCase() === 'degraded' && (
                        <div className="md:col-span-3 border border-amber-300 dark:border-amber-800/60 rounded-xl p-4 bg-amber-50 dark:bg-amber-950/30">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                              <TriangleAlert size={18} className="text-amber-700 dark:text-amber-300" />
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                                {isQuotaDegraded ? 'API Quota Exhausted' : 'AI Service Degraded'}
                              </h4>
                              <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                                {isQuotaDegraded
                                  ? 'The AI engine is temporarily offline due to API rate limits. Please update your API key in the platform settings or try again later.'
                                  : (degradedBackendReason || 'The AI engine is currently running in degraded mode. Please check backend diagnostics and retry.')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Status</p>
                        <span className={`inline-flex mt-2 px-2 py-1 rounded-full text-xs font-bold ${
                          auditVerdict.status === 'Pass' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          auditVerdict.status === 'Fail' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                          auditVerdict.status === 'Warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {auditVerdict.status}
                        </span>
                      </div>
                      <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Framework</p>
                        <p className="mt-2 text-sm font-semibold">{auditVerdict.framework || 'N/A'}</p>
                      </div>
                      <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Rule</p>
                        <p className="mt-2 text-sm">{auditVerdict.rule_violated || auditVerdict.summary || auditVerdict.message || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-3 border rounded-xl p-4 bg-white dark:bg-slate-900">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Recommendation</p>
                        <p className="mt-2 text-sm">{auditVerdict.recommendation || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 border rounded-xl transition-all ${isNode1Running ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`}>
                      <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-400"><Database size={16} /><h4 className="text-sm font-bold">Node 1: Internal Auth</h4></div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 leading-tight">Pinecone RAG vector search and Vendor Risk Engine.</p>
                      {currentUser?.role !== 'Engineer' && (
                        <button onClick={runNode1Audit} disabled={isNode1Running || isAnalyzing} className="w-full py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 rounded hover:bg-black dark:hover:bg-slate-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm">
                          {isNode1Running && <Zap size={14} className="animate-pulse text-yellow-400" />}
                          {isNode1Running ? 'Node 1 Running...' : 'Execute Node 1'}
                        </button>
                      )}
                    </div>
                    <div className={`p-4 border rounded-xl transition-all ${isNode2Running ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`}>
                      <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400"><Globe size={16} /><h4 className="text-sm font-bold">Node 2: Global Intel</h4></div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 leading-tight">SerpAPI scan against live regulatory web repositories.</p>
                      {currentUser?.role !== 'Engineer' && (
                        <button onClick={runNode2Audit} disabled={isNode2Running || isAnalyzing} className="w-full py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 rounded hover:bg-black dark:hover:bg-slate-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm">
                          {isNode2Running && <Zap size={14} className="animate-pulse text-yellow-400" />}
                          {isNode2Running ? 'Node 2 Running...' : 'Execute Node 2'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Policy Attestation Workflow */}
                  {formData.complianceStatus === 'Approved' && (
                    <div className="mt-6 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/20 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-3">
                        <FileSignature size={16} /> Mandatory Engineer Attestation
                      </h3>
                      
                      {formData.attestation?.signed ? (
                        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-lg flex items-start gap-3">
                          <CheckCircle className="text-emerald-500 mt-0.5" size={18} />
                          <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Attestation Completed</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                              Digitally Signed by {formData.attestation.name} on {new Date(formData.attestation.timestamp).toUTCString()} | IP Logged: {formData.attestation.ip}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            This feature has passed compliance audits. Before development can begin (moving to "Delivery"), the lead engineer must legally attest to understanding all constraints.
                          </p>
                          <label className="flex items-start gap-2 cursor-pointer group">
                            <input type="checkbox" checked={attestChecked} onChange={(e) => setAttestChecked(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">I have read and understand the legal constraints attached to this feature.</span>
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={attestationName}
                              onChange={(e) => setAttestationName(e.target.value)}
                              placeholder="Type your full legal name to digitally sign" 
                              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                            <button 
                              onClick={signAttestation}
                              disabled={!attestChecked || !attestationName.trim()}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            >
                              Submit Signature
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ==== TAB: AUDIT DASHBOARD ==== */}
            {activeTab === 'audit' && (
              <div className="flex-1 animate-fade-in overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <ComplianceDashboard />
                </div>
              </div>
            )}

            {/* ATTACHMENTS VAULT */}
            {activeTab === 'attachments' && (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-4 shrink-0 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Paperclip size={16} className="text-indigo-600 dark:text-indigo-400"/> Document Vault</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Attach PRDs, Compliance Certificates, and wireframes.</p>
                  </div>
                  <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 cursor-help transition-colors" title="Simulated Storage Active">Local Storage Limit: Active</span>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="mb-6">
                    <VaultUploader />
                  </div>
                  {/* Dropzone */}
                  {currentUser?.role !== 'Engineer' && (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all mb-6 ${isDragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500'}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleFileDrop}
                    >
                      <Upload size={32} className={`mx-auto mb-3 ${isDragOver ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drag & drop compliance files here</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">PDF, DOCX, CSV up to 10MB</p>
                      <label className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors inline-flex items-center gap-2">
                        <Paperclip size={14} /> Browse Files
                        <input type="file" multiple className="hidden" onChange={handleFileDrop} />
                      </label>
                    </div>
                  )}

                  {/* Attachment List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <File size={12}/> Attached Files ({(formData.attachments || []).length})
                    </h4>
                    
                    {(() => {
                      const hardcodedAttachments = [
                        { id: 'hc-1', name: 'Architecture_Diagram.png', size: '2.4 MB', uploader: 'System Admin', uploadDate: new Date().toISOString(), status: 'Approved & Active' },
                        { id: 'hc-2', name: 'Data_Flow.pdf', size: '1.1 MB', uploader: 'System Admin', uploadDate: new Date().toISOString(), status: 'Approved & Active' }
                      ];
                      const allAttachments = [...hardcodedAttachments, ...(formData.attachments || [])];
                      
                      return (
                        <div className="grid grid-cols-1 gap-3">
                          {allAttachments.map((doc) => {
                          const statusColors = {
                             'Draft': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                             'Pending Checker Review': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
                             'Approved & Active': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
                             'Rejected': 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                          };
                          
                          const isChecker = currentUser?.role === 'Compliance Officer' || currentUser?.role === 'Chief Product Officer (CPO)';

                          return (
                            <div key={doc.id} className="flex flex-col p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2" title={doc.name}>
                                      {doc.name}
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-widest ${statusColors[doc.status || 'Draft']}`}>{doc.status || 'Draft'}</span>
                                    </p>
                                    <div className="flex text-[10px] text-slate-500 dark:text-slate-400 gap-2 mt-0.5">
                                      <span>{doc.size}</span>
                                      <span>•</span>
                                      <span>{doc.uploader}</span>
                                      <span>•</span>
                                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Download (Simulated)">
                                    <Download size={14} />
                                  </button>
                                  {currentUser?.role !== 'Engineer' && (
                                    <button onClick={() => removeAttachment(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remove Document">
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Maker-Checker Action Bar */}
                              {doc.status !== 'Approved & Active' && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                  {doc.status === 'Draft' || !doc.status ? (
                                    <button onClick={() => updateAttachmentStatus(doc.id, 'Pending Checker Review')} className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded transition-colors">Submit for Approval</button>
                                  ) : doc.status === 'Pending Checker Review' && isChecker ? (
                                    <div className="flex gap-2 items-center">
                                      <button onClick={() => updateAttachmentStatus(doc.id, 'Approved & Active')} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded transition-colors flex items-center gap-1"><CheckCircle size={10}/> Approve</button>
                                      <button onClick={() => setRejectingDocId(doc.id)} className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/60 px-3 py-1.5 rounded transition-colors flex items-center gap-1"><X size={10}/> Reject</button>
                                    </div>
                                  ) : doc.status === 'Pending Checker Review' ? (
                                    <span className="text-[10px] text-slate-500 font-medium italic">Waiting for Compliance Officer review...</span>
                                  ) : doc.status === 'Rejected' ? (
                                    <div className="w-full">
                                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mb-1">Rejection Reason: <span className="text-slate-600 dark:text-slate-400 font-normal">{doc.rejectReason}</span></p>
                                      <button onClick={() => updateAttachmentStatus(doc.id, 'Draft')} className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-3 py-1 rounded transition-colors">Re-submit as Draft</button>
                                    </div>
                                  ) : null}

                                  {/* Reject Input Block */}
                                  {rejectingDocId === doc.id && (
                                    <div className="mt-2 flex gap-2">
                                      <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." className="flex-1 text-[10px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500" />
                                      <button onClick={() => updateAttachmentStatus(doc.id, 'Rejected', rejectReason)} disabled={!rejectReason.trim()} className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 rounded disabled:opacity-50">Confirm Reject</button>
                                      <button onClick={() => setRejectingDocId(null)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ); })()}
                  </div>
                </div>
              </div>
            )}

            {/* ==== TAB: COMMENTS & MENTIONS ==== */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* Compose Area */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><MessageSquare size={12} /> New Comment</h4>
                  
                  {/* Mention Selector */}
                  <div className="flex gap-2 items-center">
                    <AtSign size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <select
                      value={mentionUser}
                      onChange={(e) => setMentionUser(e.target.value)}
                      className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <option value="">Mention someone...</option>
                      {allUsers.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
                    </select>
                    {mentionUser && <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold">@{mentionUser}</span>}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment || ''}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(e)}
                      className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Write a comment..."
                    />
                    <button onClick={handleAddComment} className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors">
                      <Send size={14} />
                    </button>
                  </div>
                </div>

                {/* Comments Thread */}
                <div className="space-y-4">
                  {(() => {
                    const hardcodedComments = [
                      { user: 'System Admin', text: '[@Aman] Please review the Twilio integration risk.', timestamp: new Date(Date.now() - 3600000).toISOString() }
                    ];
                    const allComments = [...(formData.comments || []), ...hardcodedComments];
                    return allComments.map((c, i) => {
                    const isSystem = c.user?.includes('Node');
                    const hasMention = String(c.text).includes('@');
                    return (
                      <div key={i} className={`flex gap-3 p-3 rounded-lg transition-colors ${isSystem ? 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isSystem ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {isSystem ? <Cpu size={14}/> : (c.user || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{String(c.user)}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(c.timestamp)}</span>
                            {isSystem && <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">AI Agent</span>}
                          </div>
                          <div className={`text-sm mt-1 whitespace-pre-wrap leading-relaxed ${isSystem ? 'font-mono text-[11px] text-slate-600 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {String(c.text).split(/(@\w+)/g).map((part, j) =>
                              part.startsWith('@') ? <span key={j} className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">{part}</span> : part
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })})()}
                </div>
              </div>
            )}

            {/* ==== TAB: AUDIT TRAIL / HISTORY ==== */}
            {activeTab === 'history' && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Clock size={14} /> Change History & Audit Trail
                </h3>
                {(formData.history || []).length === 0 && (
                  <div className="text-center text-slate-400 dark:text-slate-500 py-8">
                    <Clock size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No history yet. Changes will be tracked automatically.</p>
                  </div>
                )}
                <div className="relative">
                  {/* Vertical timeline line */}
                  {(formData.history || []).length > 0 && (
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
                  )}
                  <div className="space-y-0">
                    {(formData.history || []).map((h, i) => {
                      const isSystem = h.user === 'System' || h.action.includes('Node') || h.action.includes('AI');
                      const iconColor = h.action.includes('failed') ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60'
                        : h.action.includes('completed') ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                        : h.action.includes('initiated') ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                        : h.action.includes('Status') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                      return (
                        <div key={i} className="flex gap-3 py-2.5 relative">
                          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border z-10 ${iconColor}`}>
                            {isSystem ? <Cpu size={12} /> : (h.user || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{h.action}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(h.timestamp)}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{h.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT SIDEBAR ===== */}
          <div className="w-64 border-l border-slate-100 dark:border-slate-800 p-6 space-y-5 shrink-0 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            {/* Board Status */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Board Status</label>
              <select name="status" value={formData.status || ''} onChange={handleStatusChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded text-sm mt-1 outline-none font-bold text-slate-700 dark:text-slate-200">
                {COLUMNS.map(c => {
                   let disabled = false;
                   if (formData.complianceStatus === 'Blocked') {
                     if (['Design', 'Delivery', 'Done'].includes(c)) disabled = true;
                   } else if (formData.complianceStatus === 'Approved' && !formData.attestation?.signed) {
                     if (['Delivery', 'Done'].includes(c)) disabled = true;
                   }
                   return <option key={c} value={c} disabled={disabled}>{c}{disabled ? ' (Blocked)' : ''}</option>;
                })}
              </select>
            </div>

            {/* Epic */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Epic</label>
              <select name="epicId" value={formData.epicId || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded text-sm mt-1 outline-none font-bold text-slate-700 dark:text-slate-200">
                <option value="">No Epic</option>
                {(epics || []).map(epic => (<option key={epic.id} value={epic.id}>● {epic.name}</option>))}
              </select>
            </div>

            {/* Timeline */}
            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/80">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1"><Calendar size={11} /> Timeline</div>
              <div className="space-y-2">
                <div><label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Start</label><input type="date" name="startDate" value={formData.startDate || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs mt-0.5 outline-none" /></div>
                <div><label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">End</label><input type="date" name="endDate" value={formData.endDate || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs mt-0.5 outline-none" /></div>
              </div>
            </div>

            {/* RICE */}
            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/80">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">RICE</div>
              {['reach', 'impact', 'confidence', 'effort'].map(field => (
                <div key={field} className="mb-2">
                  <div className="flex justify-between text-[10px] capitalize mb-0.5 text-slate-600 dark:text-slate-400"><span>{field}</span><span className="font-mono text-slate-800 dark:text-slate-200">{formData[field]}</span></div>
                  <input type="range" name={field} min="0" max={field === 'effort' ? '50' : field === 'reach' ? '3000' : '3'} step="0.1" value={formData[field] || 0} onChange={handleInputChange} className="w-full appearance-none h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center mt-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Score</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{calculateRice(formData.reach, formData.impact, formData.confidence, formData.effort)}</span>
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><Link2 size={11} /> Dependencies</div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {linkableFeatures.length > 0 ? linkableFeatures.map(f => {
                  const isLinked = (formData.dependencies || []).includes(f.id);
                  return (
                    <div key={f.id} onClick={() => toggleDependency(f.id)} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[11px] transition-all ${isLinked ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400 font-semibold' : 'bg-white dark:bg-slate-800/80 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}>
                      <span className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[7px] ${isLinked ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{isLinked && '✓'}</span>
                      <span className="truncate">{f.title}</span>
                    </div>
                  );
                }) : <p className="text-[10px] text-slate-400 dark:text-slate-500 py-1">No features to link.</p>}
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Attributes</div>
              <div><span className="text-[10px] text-slate-500 dark:text-slate-400">Region</span><select name="region" value={formData.region || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-1.5 rounded outline-none text-xs mt-0.5">{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div><span className="text-[10px] text-slate-500 dark:text-slate-400">Industry</span><select name="industry" value={formData.industry || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-1.5 rounded outline-none text-xs font-medium mt-0.5">{Object.keys(INDUSTRY_REGULATIONS).map(i => <option key={i} value={i}>{i}</option>)}</select></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
          <div>
            {selectedFeature && currentUser?.role !== 'Engineer' && (
              <button 
                onClick={() => onDelete(selectedFeature.id)} 
                className="px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateComplianceReport}
              className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Generate Compliance Report
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors">Cancel</button>
            {currentUser?.role !== 'Engineer' && (
              <button onClick={saveAndClose} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 dark:bg-indigo-500 rounded shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">Save Changes</button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
