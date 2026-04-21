import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchVaultDocumentUrl, fetchVaultDocuments, uploadVaultDocument, deleteVaultDocument, importVaultLocalFolder, updateVaultDocumentTags } from '../utils/api';
import { useProject } from '../context/ProjectContext';

const TOAST_MS = 5000;

const REGION_OPTIONS = ['US', 'EU', 'India', 'Japan', 'China', 'Singapore', 'Global'];
const INDUSTRY_OPTIONS = ['FinTech & Banking', 'Healthcare & MedTech', 'General SaaS / AI', 'Hardware / Safety'];
const DOC_TYPE_OPTIONS = ['regulation', 'standard', 'framework', 'reference'];

export default function VaultUploader() {
  const { currentUser } = useProject();
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  /** Tracks Celery background phase when REDIS_URL is set (upload vs vector indexing). */
  const [ingestPhase, setIngestPhase] = useState('idle');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const isAdmin = currentUser?.role === 'admin';
  const [uploadTags, setUploadTags] = useState({ region: '', industry: '', doc_type: '' });
  const [importPath, setImportPath] = useState('D:\\MTP\\Compliance');
  const [importing, setImporting] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [editTags, setEditTags] = useState({ region: '', industry: '', doc_type: '' });
  const [savingTags, setSavingTags] = useState(false);

  const showToast = (message, variant = 'success') => {
    setToast({ message, variant });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  const loadDocs = async () => {
    try {
      const items = await fetchVaultDocuments();
      setDocs(items);
    } catch (err) {
      setError(String(err.message || 'Failed to load documents'));
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const docsById = useMemo(() => {
    const m = new Map();
    (docs || []).forEach((d) => m.set(d.id, d));
    return m;
  }, [docs]);

  const onFiles = async (files) => {
    const pdfFiles = Array.from(files || []).filter((f) => f.type === 'application/pdf');
    if (!pdfFiles.length) {
      setError('Only PDF files are accepted.');
      return;
    }
    const oversized = pdfFiles.some(f => f.size > 209715200);
    if (oversized) {
      setError('Max file size: 200 MB.');
      return;
    }
    setError('');
    setUploading(true);
    setIngestPhase('idle');
    try {
      for (const file of pdfFiles) {
        const form = new FormData();
        form.append('file', file);
        if (uploadTags.region) form.append('region', uploadTags.region);
        if (uploadTags.industry) form.append('industry', uploadTags.industry);
        if (uploadTags.doc_type) form.append('doc_type', uploadTags.doc_type);
        await uploadVaultDocument(form, {
          onPhase: setIngestPhase,
          pollIntervalMs: 3000
        });
      }
      await loadDocs();
      showToast(
        pdfFiles.length === 1
          ? 'Document indexed and ready for compliance search.'
          : `${pdfFiles.length} documents indexed and ready for compliance search.`,
        'success'
      );
    } catch (err) {
      const msg = String(err.message || 'Upload failed');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setUploading(false);
      setIngestPhase('idle');
    }
  };

  const openDocument = async (docId) => {
    try {
      const data = await fetchVaultDocumentUrl(docId);
      if (data?.url) window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(String(err.message || 'Could not open document'));
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteVaultDocument(docId);
      await loadDocs();
    } catch (err) {
      setError(String(err.message || 'Failed to delete document'));
    }
  };

  const onImportLocal = async () => {
    const dir = (importPath || '').trim();
    if (!dir) return;
    setError('');
    setImporting(true);
    try {
      const res = await importVaultLocalFolder(dir);
      showToast(`Import started: ${res?.count ?? 0} PDFs queued for vectorization.`, 'success');
      await loadDocs();
    } catch (err) {
      const msg = String(err.message || 'Import failed');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setImporting(false);
    }
  };

  const openEdit = (docId) => {
    const d = docsById.get(docId);
    if (!d) return;
    setEditDoc(d);
    setEditTags({
      region: d.region || '',
      industry: d.industry || '',
      doc_type: d.doc_type || '',
    });
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    setSavingTags(true);
    setError('');
    try {
      const updated = await updateVaultDocumentTags(editDoc.id, editTags);
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      setEditDoc(null);
      showToast('Tags updated.', 'success');
    } catch (err) {
      const msg = String(err.message || 'Failed to update tags');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingTags(false);
    }
  };

  const uploadButtonLabel = !uploading
    ? 'Select PDFs'
    : ingestPhase === 'analyzing'
      ? 'Analyzing compliance vectors…'
      : 'Uploading…';

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900">Bulk import (server folder)</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Imports PDFs from a server-local directory and starts offline vectorization.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={importPath}
                onChange={(e) => setImportPath(e.target.value)}
                className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-[22rem]"
                placeholder="D:\\MTP\\Compliance"
              />
              <button
                type="button"
                onClick={onImportLocal}
                disabled={importing}
                className="h-10 shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm shadow-indigo-200/50 transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {importing ? 'Importing…' : 'Import PDFs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div
        className="border-2 border-dashed rounded-2xl p-5 text-center bg-slate-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">Upload PDFs</p>
            <p className="text-xs text-slate-500 mt-1">Max file size: 200 MB. Large PDFs may run in a background worker; the UI waits until indexing finishes.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="text-left text-[11px] font-bold text-slate-500">
              Region (optional)
              <select
                value={uploadTags.region}
                onChange={(e) => setUploadTags((t) => ({ ...t, region: e.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Auto</option>
                {REGION_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="text-left text-[11px] font-bold text-slate-500">
              Industry (optional)
              <select
                value={uploadTags.industry}
                onChange={(e) => setUploadTags((t) => ({ ...t, industry: e.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Auto</option>
                {INDUSTRY_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="text-left text-[11px] font-bold text-slate-500">
              Doc type (optional)
              <select
                value={uploadTags.doc_type}
                onChange={(e) => setUploadTags((t) => ({ ...t, doc_type: e.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Auto</option>
                {DOC_TYPE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mx-auto inline-flex w-fit px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold cursor-pointer shadow-sm shadow-indigo-200/50">
          {uploadButtonLabel}
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        </div>
      </div>
      )}

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-md rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl ${
            toast.variant === 'error'
              ? 'border-rose-300 bg-rose-950 text-rose-50 dark:border-rose-800 dark:bg-rose-950/95'
              : 'border-emerald-300 bg-emerald-950 text-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/95'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2">Filename</th>
              <th className="text-left px-3 py-2">Region</th>
              <th className="text-left px-3 py-2">Industry</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Uploaded</th>
              <th className="text-left px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{doc.filename}</td>
                <td className="px-3 py-2 text-slate-600">{doc.region || '-'}</td>
                <td className="px-3 py-2 text-slate-600">{doc.industry || '-'}</td>
                <td className="px-3 py-2 text-slate-600">{doc.doc_type || '-'}</td>
                <td className="px-3 py-2">{doc.created_at ? new Date(doc.created_at).toLocaleString() : '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openDocument(doc.id)} className="text-indigo-600 font-semibold hover:underline">
                      Open secure link
                    </button>
                    {isAdmin && (
                      <button onClick={() => openEdit(doc.id)} className="text-slate-700 font-semibold hover:underline">
                        Edit tags
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(doc.id)} className="text-rose-600 font-semibold hover:underline">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={6}>No documents uploaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_4px_40px_rgb(0,0,0,0.10)]">
            <div className="mb-4">
              <p className="text-sm font-black text-slate-900">Edit tags</p>
              <p className="mt-1 text-xs font-medium text-slate-500 truncate">{editDoc.filename}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-[11px] font-bold text-slate-500">
                Region
                <select
                  value={editTags.region}
                  onChange={(e) => setEditTags((t) => ({ ...t, region: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">(none)</option>
                  {REGION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-500">
                Industry
                <select
                  value={editTags.industry}
                  onChange={(e) => setEditTags((t) => ({ ...t, industry: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">(none)</option>
                  {INDUSTRY_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-500">
                Type
                <select
                  value={editTags.doc_type}
                  onChange={(e) => setEditTags((t) => ({ ...t, doc_type: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">(none)</option>
                  {DOC_TYPE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditDoc(null)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                disabled={savingTags}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingTags}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-200/50 hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingTags ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
