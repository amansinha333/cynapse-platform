import React, { useState } from 'react';
import {
  Key, Database, Cpu, CheckCircle, AlertTriangle,
  UploadCloud, List, FileText, Trash2
} from 'lucide-react';
import { extractPdfText } from '../utils/pdf';
import { useProject } from '../context/ProjectContext';

export default function SettingsView() {
  const {
    globalApiKey: apiKey, setGlobalApiKey: setApiKey,
    backendUrl, setBackendUrl,
    pineconeKey, setPineconeKey,
    serpapiKey, setSerpapiKey,
    aiModel, setAiModel,
    customDocs, setCustomDocs,
    backendStatus,
    uploadedFiles, setUploadedFiles,
    vendors, setVendors
  } = useProject();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setIsUploading(true);

    if (backendStatus) {
      setUploadStatus(`Ingesting ${files.length} documents into Pinecone Vector DB...`);
      try {
        for (let i = 0; i < files.length; i++) {
          const formData = new FormData();
          formData.append("file", files[i]);
          await fetch(`${backendUrl}/api/upload`, { method: 'POST', body: formData });
        }
        setUploadStatus('Successfully synced and embedded into Enterprise RAG.');
        setUploadedFiles(prev => {
          const newFiles = Array.from(files).map(f => f.name);
          return [...new Set([...prev, ...newFiles])];
        });
      } catch (err) {
        console.error("Backend upload failed", err);
        setUploadStatus('Upload failed. Check Python server connection.');
      }
      setTimeout(() => setIsUploading(false), 2000);
      return;
    }

    setUploadStatus(`Processing 0 / ${files.length} files locally...`);
    let combinedText = customDocs ? customDocs + '\n\n' : '';
    for (let i = 0; i < files.length; i++) {
      setUploadStatus(`Processing file ${i + 1} of ${files.length}: ${files[i].name}...`);
      try {
        let text = '';
        if (files[i].type === 'application/pdf' || files[i].name.endsWith('.pdf')) {
          text = await extractPdfText(files[i]);
        } else {
          text = await files[i].text();
        }
        combinedText += `\n--- SOURCE: ${files[i].name} ---\n${text}\n`;
      } catch (err) { console.error(`Error reading ${files[i].name}`, err); }
    }
    if (combinedText.length > 3000000) combinedText = combinedText.substring(0, 3000000);
    setCustomDocs(combinedText);
    setUploadedFiles(prev => {
      const newFiles = Array.from(files).map(f => f.name);
      return [...new Set([...prev, ...newFiles])];
    });
    setIsUploading(false);
    setUploadStatus('');
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* 1. Architecture Status Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Cpu size={20}/> System Architecture Status</h3>

        {backendStatus ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-lg mb-2">
            <p className="text-sm text-emerald-800 dark:text-emerald-400 font-bold flex items-center gap-2"><CheckCircle size={16} /> Python FastAPI Connected</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Routing requests to 127.0.0.1:8000. Pinecone RAG Active.</p>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg mb-2">
            <p className="text-sm text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2"><AlertTriangle size={16} /> Local Sandbox Mode Active</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">FastAPI backend not detected at {backendUrl}. Using browser-based memory execution.</p>
          </div>
        )}
      </div>

      {/* 2. Platform Configuration */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Key size={20}/> Enterprise API Configuration</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Enter your proprietary keys to connect the UI to AI agents and databases.</p>
        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg col-span-1 md:col-span-2 mt-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 mb-2"><Database size={16} /> FastAPI Backend URL</h4>
            <input type="text" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} placeholder="http://127.0.0.1:8000" className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg">
            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2"><Key size={16} /> Google Gemini API Key</h4>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-800/50 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg">
            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2"><Key size={16} /> Pinecone API Key</h4>
            <input type="password" value={pineconeKey} onChange={(e) => setPineconeKey(e.target.value)} placeholder="pcsk_..." className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-800/50 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg">
            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2"><Key size={16} /> SerpAPI Key</h4>
            <input type="password" value={serpapiKey} onChange={(e) => setSerpapiKey(e.target.value)} placeholder="Secret Token" className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-800/50 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h4 className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Select Gemini Model</h4>
            <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md px-4 py-2 text-sm outline-none font-medium">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - High Free Limit)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced - Low Free Limit)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Knowledge Base Upload & Index Log */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Database size={20}/> Regulatory Knowledge Base</h3>
          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{uploadedFiles.length} Documents</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Upload PDFs to teach the AI your specific company rules. If backend is active, files are securely chunked and sent to your Pinecone Vector DB.</p>

        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 dark:border-indigo-700/50 rounded-lg cursor-pointer transition-colors mb-4 ${isUploading ? 'bg-slate-100 dark:bg-slate-800 cursor-wait' : 'bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-indigo-600 dark:text-indigo-400">
            {isUploading ? <Database size={32} className="mb-2 animate-pulse" /> : <UploadCloud size={32} className="mb-2" />}
            <p className="text-sm font-semibold">{isUploading ? 'Ingesting...' : 'Click to upload bulk compliance documents'}</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400/70 mt-1">Supports .pdf, .txt</p>
          </div>
          <input type="file" multiple accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
        </label>

        {uploadStatus && <div className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded animate-pulse text-center">{uploadStatus}</div>}

        {/* Enhanced Visual Index Log */}
        <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><List size={16}/> Knowledge Base Index Log</h4>
            <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full">{uploadedFiles.length} Indexed</span>
          </div>

          {uploadedFiles.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2">Document Name</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Storage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50" style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                  {uploadedFiles.map((file, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
                        <FileText size={14} className="text-indigo-500 dark:text-indigo-400 shrink-0"/> {file}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10}/> Embedded
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">{backendStatus ? 'Pinecone DB' : 'Local Memory'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Database size={24} className="mb-2 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-medium">Index Log is Empty</p>
              <p className="text-xs mt-1">Upload documents above to embed them into your Enterprise AI.</p>
            </div>
          )}

          {uploadedFiles.length > 0 && (
             <button onClick={() => { setUploadedFiles([]); setCustomDocs(''); }} className="mt-4 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold transition-colors"><Trash2 size={12}/> Clear Frontend Log</button>
          )}
        </div>
      </div>

      {/* Vendor Risk Registry */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><CheckCircle size={20} className="text-indigo-600 dark:text-indigo-400" /> Vendor Risk Registry</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage and monitor third-party vendor compliance.</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600">{(vendors || []).length} Active Vendors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Vendor Name</th>
                <th className="px-6 py-3">Service Type</th>
                <th className="px-6 py-3 text-center">Inherent Risk</th>
                <th className="px-6 py-3 text-center">Compliance Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {(vendors || []).map(vendor => {
                 const statusColors = {
                   'Approved': 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
                   'Pending Review': 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                 };
                 const riskColors = {
                   'Low': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                   'Medium': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
                   'High': 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                 };
                 return (
                   <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-100 dark:border-indigo-800/50">
                         {vendor.name.charAt(0)}
                       </div>
                       {vendor.name}
                     </td>
                     <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                       {vendor.type}
                     </td>
                     <td className="px-6 py-4 text-center">
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-transparent ${riskColors[vendor.risk]}`}>{vendor.risk}</span>
                     </td>
                     <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${statusColors[vendor.status]}`}>
                         {vendor.status === 'Approved' ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>} {vendor.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded transition-colors">
                         View Due Diligence
                       </button>
                     </td>
                   </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
