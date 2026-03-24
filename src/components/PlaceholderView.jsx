import React from 'react';

export default function PlaceholderView({ title, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6">
        <Icon size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md">This module is currently being configured for your workspace.</p>
    </div>
  );
}
