import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Lock, GripVertical, Info } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

// --- Helpers ---
const toDate = (str) => str ? new Date(str) : new Date();
const fmtDate = (d) => d.toISOString().split('T')[0];
const daysDiff = (a, b) => Math.round((b - a) / 86400000);

const MONTHS_SHOWN = 12;

export default function TimelineView() {
  const { filteredFeatures: features, epics, handleUpdateDates: onUpdateDates } = useProject();
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const timelineStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const timelineEnd = useMemo(() => {
    const d = new Date(timelineStart);
    d.setMonth(d.getMonth() + MONTHS_SHOWN);
    return d;
  }, [timelineStart]);

  const totalDays = daysDiff(timelineStart, timelineEnd);

  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < MONTHS_SHOWN; i++) {
      const d = new Date(timelineStart);
      d.setMonth(d.getMonth() + i);
      result.push({
        label: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear().toString().slice(-2),
        offset: daysDiff(timelineStart, d) / totalDays * 100,
      });
    }
    return result;
  }, [timelineStart, totalDays]);

  const getBarStyle = useCallback((feature) => {
    const start = toDate(feature.startDate);
    const end = toDate(feature.endDate);
    const leftPct = Math.max(0, daysDiff(timelineStart, start) / totalDays * 100);
    const widthPct = Math.max(2, daysDiff(start, end) / totalDays * 100);
    return { left: `${leftPct}%`, width: `${Math.min(widthPct, 100 - leftPct)}%` };
  }, [timelineStart, totalDays]);

  const handleMouseDown = useCallback((e, featureId, edge) => {
    e.preventDefault();
    const feature = features.find(f => f.id === featureId);
    if (!feature || feature.complianceStatus === 'Blocked') return;

    setDragging({
      featureId,
      edge,
      startX: e.clientX,
      origStart: feature.startDate,
      origEnd: feature.endDate,
    });
  }, [features]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const dx = e.clientX - dragging.startX;
    const daysMoved = Math.round((dx / containerWidth) * totalDays);

    if (daysMoved === 0) return;

    const origStart = toDate(dragging.origStart);
    const origEnd = toDate(dragging.origEnd);

    let newStart, newEnd;
    if (dragging.edge === 'bar') {
      newStart = new Date(origStart);
      newStart.setDate(newStart.getDate() + daysMoved);
      newEnd = new Date(origEnd);
      newEnd.setDate(newEnd.getDate() + daysMoved);
    } else if (dragging.edge === 'end') {
      newStart = origStart;
      newEnd = new Date(origEnd);
      newEnd.setDate(newEnd.getDate() + daysMoved);
      if (newEnd <= newStart) return;
    }

    onUpdateDates?.(dragging.featureId, fmtDate(newStart), fmtDate(newEnd));
  }, [dragging, totalDays, onUpdateDates]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const ROW_HEIGHT = 64;

  return (
    <div className="space-y-6 animate-fade-in relative bg-transparent h-full flex flex-col">
      {/* Title bar Header */}
      <div className="px-8 py-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-none flex justify-between items-center mb-4 border border-indigo-50/50 dark:border-slate-800">
        <div>
          <h3 className="text-[12px] font-black text-[#24389c] dark:text-indigo-400 uppercase tracking-[0.2em] mb-1">STRATEGIC ROADMAP</h3>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <Info size={12} className="text-[#24389c] dark:text-indigo-400" /> Dynamic Timeline Orchestration
          </div>
        </div>
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-[#f7f9fb] dark:bg-slate-800 px-4 py-2 rounded-xl">
              <GripVertical size={14} className="text-[#24389c]" /> Move to Shift
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/30 px-4 py-2 rounded-xl">
              <Lock size={14} /> Locked State
            </div>
        </div>
      </div>

      {/* Gantt Area */}
      <div
        className="flex-1 overflow-x-auto custom-scrollbar rounded-[2rem] bg-[#f7f9fb] dark:bg-slate-950/50"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="min-w-[1200px] p-4">
          {/* Header row — months */}
          <div className="flex h-12 mb-4">
            <div className="w-64 shrink-0 px-8 flex items-center text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              Initiative Cluster
            </div>
            <div className="flex-1 relative" ref={containerRef}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex flex-col justify-center px-4 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest border-l border-slate-200 dark:border-slate-800"
                  style={{ left: `${m.offset}%` }}
                >
                  <span>{m.label}</span>
                  <span className="opacity-40 text-[8px] font-bold">20{m.year}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature rows */}
          <div className="space-y-4">
            {features.map((f, idx) => {
              const epic = epics?.find(e => e.id === f.epicId);
              const isBlocked = f.complianceStatus === 'Blocked';
              const barStyle = getBarStyle(f);
              const barColor = isBlocked ? '#f1f5f9' : (epic?.color || '#24389c');

              return (
                <div
                  key={f.id}
                  className={`flex bg-white dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 rounded-3xl shadow-sm border border-transparent hover:border-indigo-50 dark:hover:border-slate-800 ${isBlocked ? 'opacity-50 grayscale' : ''}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Label column */}
                  <div className="w-64 shrink-0 px-8 flex items-center gap-4 overflow-hidden relative">
                    {epic && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full shrink-0" style={{ background: epic.color }}></div>}
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[#191c1e] dark:text-slate-200 truncate leading-tight group-hover:text-[#24389c] transition-colors">{f.title}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-tighter uppercase mt-1">{f.id}</div>
                    </div>
                    {isBlocked && <Lock size={12} className="text-rose-400 shrink-0 ml-auto" />}
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative flex items-center px-4 overflow-hidden group">
                    {/* Gridlines */}
                    {months.map((m, i) => (
                      <div key={i} className="absolute top-0 h-full border-l border-slate-100/50 dark:border-slate-800/30" style={{ left: `${m.offset}%` }}></div>
                    ))}

                    {/* Bar */}
                    <div
                      className={`absolute h-9 rounded-2xl flex items-center justify-between px-4 text-[11px] font-black text-white select-none transition-all duration-300 shadow-xl shadow-black/5 ${
                        isBlocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-[1.01]'
                      } ${dragging?.featureId === f.id ? 'ring-4 ring-indigo-500/20 z-50' : ''}`}
                      style={{
                        ...barStyle,
                        background: isBlocked
                          ? `repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 8px, #ffffff 8px, #ffffff 16px)`
                          : barColor,
                        color: isBlocked ? '#94a3b8' : 'white'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, f.id, 'bar')}
                    >
                      <span className="truncate uppercase tracking-wider">
                        {isBlocked ? 'Protocol Locked' : f.title}
                      </span>

                      {!isBlocked && (
                        <div
                          className="absolute right-0 top-0 h-full w-4 cursor-ew-resize hover:bg-white/20 rounded-r-2xl transition-colors"
                          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, f.id, 'end'); }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
