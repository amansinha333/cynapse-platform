import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export default function ProfileMenu() {
  const { currentUser, isDarkMode, setIsDarkMode, handleLogout } = useProject();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const initials = (currentUser?.name || 'Aman Sinha')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AS';
  const email = currentUser?.email || 'aman@cynapse.io';

  const Row = ({ icon: Icon, label, onClick, trailing }) => (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm flex items-center justify-between"
    >
      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Icon size={15} />
        {label}
      </span>
      {trailing}
    </button>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 text-[#24389c] dark:text-indigo-300 flex items-center gap-2 px-2 border-2 border-white dark:border-slate-800 shadow-sm"
      >
        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
          {initials}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 z-50">
          <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700 mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center justify-center">AS</div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{currentUser?.name || 'Aman Sinha'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>
              </div>
            </div>
          </div>

          <Row icon={User} label="My Profile" onClick={() => { setOpen(false); navigate('/dashboard/profile'); }} />
          <Row icon={Settings} label="Personal Settings" onClick={() => { setOpen(false); navigate('/dashboard/account?context=personal&tab=general'); }} />
          <Row icon={Settings} label="Workspace Settings" onClick={() => { setOpen(false); navigate('/dashboard/account?context=admin&tab=system'); }} />
          <Row icon={Settings} label="Billing & Subscriptions" onClick={() => { setOpen(false); navigate('/dashboard/account?context=billing&tab=billing'); }} />
          <Row
            icon={isDarkMode ? Sun : Moon}
            label={`Dark Mode: ${isDarkMode ? 'On' : 'Off'}`}
            onClick={() => setIsDarkMode(!isDarkMode)}
            trailing={<span className="text-[10px] text-slate-500">{isDarkMode ? 'Switch to light' : 'Switch to dark'}</span>}
          />
          <Row
            icon={LogOut}
            label="Log out"
            onClick={() => { setOpen(false); handleLogout(); }}
          />
        </div>
      )}
    </div>
  );
}
