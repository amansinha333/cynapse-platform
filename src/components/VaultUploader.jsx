import React, { useEffect, useRef, useState } from 'react';
import { fetchVaultDocumentUrl, fetchVaultDocuments, uploadVaultDocument, deleteVaultDocument } from '../utils/api';
import { useProject } from '../context/ProjectContext';

const TOAST_MS = 5000;

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

  const uploadButtonLabel = !uploading
    ? 'Select PDFs'
    : ingestPhase === 'analyzing'
      ? 'Analyzing compliance vectors…'
      : 'Uploading…';

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div
        className="border-2 border-dashed rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-800/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-semibold">Drag and drop PDF files</p>
        <p className="text-xs text-slate-500 mt-1 mb-3">Max file size: 200 MB. Large PDFs may run in a background worker; the UI waits until indexing finishes.</p>
        <label className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer">
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

      <div className="border rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="text-left px-3 py-2">Filename</th>
              <th className="text-left px-3 py-2">Uploaded</th>
              <th className="text-left px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="border-t border-slate-200 dark:border-slate-700">
                <td className="px-3 py-2">{doc.filename}</td>
                <td className="px-3 py-2">{doc.created_at ? new Date(doc.created_at).toLocaleString() : '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openDocument(doc.id)} className="text-indigo-600 font-semibold hover:underline">
                      Open secure link
                    </button>
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
                <td className="px-3 py-4 text-slate-500" colSpan={3}>No documents uploaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
