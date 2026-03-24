import React, { useState } from 'react';
import { Calendar as CalendarIcon, List, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, FileSignature } from 'lucide-react';

const STATUTORY_EVENTS = [
  { id: 1, title: 'SOC 2 Type II Annual Audit Window', date: 'Nov 1 - Nov 15', rawDate: '2026-11-01', status: 'On Track' },
  { id: 2, title: 'ISO 27001 Surveillance Audit', date: 'May 15', rawDate: '2026-05-15', status: 'On Track' },
  { id: 3, title: 'RBI Quarterly Data Localization Report', date: 'Mar 31', rawDate: '2026-03-31', status: 'Upcoming' },
  { id: 4, title: 'Annual Infrastructure Penetration Test', date: 'Aug 10', rawDate: '2026-08-10', status: 'On Track' },
  { id: 5, title: 'Mandatory Employee Security Training', date: 'Jan 15', rawDate: '2026-01-15', status: 'Overdue' },
  { id: 6, title: 'GDPR DPA Renewal Deadline', date: 'Oct 1', rawDate: '2026-10-01', status: 'On Track' },
  // Adding the other RBI quarters to make it complete as specified:
  { id: 7, title: 'RBI Quarterly Data Localization Report', date: 'Jun 30', rawDate: '2026-06-30', status: 'On Track' },
  { id: 8, title: 'RBI Quarterly Data Localization Report', date: 'Sep 30', rawDate: '2026-09-30', status: 'On Track' },
  { id: 9, title: 'RBI Quarterly Data Localization Report', date: 'Dec 31', rawDate: '2026-12-31', status: 'On Track' },
];

export default function CalendarView() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const getStatusColor = (status) => {
    switch(status) {
      case 'Overdue': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
      case 'Upcoming': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'On Track': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Overdue': return <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400" />;
      case 'Upcoming': return <Clock size={14} className="text-amber-600 dark:text-amber-400" />;
      case 'On Track': return <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />;
      default: return null;
    }
  };

  // Mock calendar grid generation (March 2026)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startDayOffset = 0; // Starts on Sunday for March 2026 mock
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" size={24} />
            Statutory Compliance Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and attest to global regulatory deadlines.</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm font-bold flex items-center gap-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <List size={16} /> List View
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-sm font-bold flex items-center gap-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <CalendarIcon size={16} /> Grid View
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        {viewMode === 'list' ? (
          <div>
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div className="col-span-6">Statutory Event</div>
              <div className="col-span-3">Deadline Date</div>
              <div className="col-span-3">Compliance Status</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {STATUTORY_EVENTS.sort((a,b) => new Date(a.rawDate) - new Date(b.rawDate)).map(event => (
                <div key={event.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <FileSignature size={16} />
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{event.title}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <CalendarIcon size={14} className="text-slate-400" /> {event.date}
                  </div>
                  <div className="col-span-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)} {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">March 2026</h2>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors text-center w-20">Today</button>
                <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-slate-50 dark:bg-slate-800 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  {day}
                </div>
              ))}
              
              {/* Empty offset days */}
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white dark:bg-slate-900 min-h-[100px] p-2 opacity-30"></div>
              ))}
              
              {/* Calendar Days */}
              {daysInMonth.map(day => {
                // Find events matching this day (Mocking for March 2026)
                const dayEvents = STATUTORY_EVENTS.filter(e => e.rawDate === `2026-03-${day.toString().padStart(2, '0')}`);
                const isToday = day === 20; // Mock today

                return (
                  <div key={day} className={`bg-white dark:bg-slate-900 min-h-[100px] p-1.5 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <div className={`text-xs font-bold text-center w-6 h-6 mx-auto flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                      {day}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {dayEvents.map(event => (
                        <div key={event.id} className={`text-[10px] p-1.5 rounded border leading-tight ${getStatusColor(event.status)} cursor-pointer hover:opacity-80 transition-opacity truncate`}>
                           {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Deadlines Sidebar */}
      <div className="mt-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-amber-600 dark:text-amber-400" /> Upcoming Deadlines
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Next 90 days compliance obligations</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {STATUTORY_EVENTS
            .filter(e => {
              const diff = (new Date(e.rawDate) - new Date()) / (1000 * 60 * 60 * 24);
              return diff > -30 && diff < 90;
            })
            .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
            .map(event => {
              const daysUntil = Math.ceil((new Date(event.rawDate) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={event.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(event.status)}
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{event.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{event.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                    daysUntil < 0 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' :
                    daysUntil < 30 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' :
                    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                  }`}>
                    {daysUntil < 0 ? `${Math.abs(daysUntil)}d Overdue` : daysUntil === 0 ? 'Today' : `${daysUntil}d left`}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
