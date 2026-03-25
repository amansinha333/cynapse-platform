import React from 'react';
import { Network, Database } from 'lucide-react';
import VaultUploader from '../components/VaultUploader';

export default function VaultPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight gradient-text">Knowledge Vault</h1>
            <p className="text-sm text-slate-500 font-medium">Enterprise compliance documents and foundational context.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <VaultUploader />
      </div>
    </div>
  );
}
