import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors, closestCenter
} from '@dnd-kit/core';
import { Lock, ShieldAlert, AlertTriangle, Flame } from 'lucide-react';
import { ComplianceBadge } from './Badges';
import { COLUMNS, GATED_COLUMNS } from '../config/constants';
import { useProject } from '../context/ProjectContext';
import { springs, easings } from '../utils/motion';

function DraggableCard({ feature, openEditModal, epics, isDragOverlay, currentUser }) {
  const isBlocked = feature.complianceStatus === 'Blocked';
  const epic = epics?.find(e => e.id === feature.epicId);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: feature.id,
    data: { feature },
    disabled: currentUser?.role === 'Engineer' || isBlocked,
  });

  return (
    <motion.div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : { ...listeners, ...attributes })}
      layout={!isDragOverlay}
      initial={isDragOverlay ? false : { opacity: 0, scale: 0.95, y: 8 }}
      animate={{
        opacity: isDragging && !isDragOverlay ? 0.2 : 1,
        scale: isDragging && !isDragOverlay ? 0.95 : 1,
        y: 0,
      }}
      transition={springs.gentle}
      whileHover={!isDragging && !isDragOverlay && !isBlocked ? { y: -4 } : undefined}
      className={`bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none ${
        isBlocked ? 'opacity-60 grayscale-[0.5]' : ''
      } ${isDragOverlay ? 'shadow-2xl ring-4 ring-[#24389c]/10 dark:ring-indigo-500/20 rotate-1 scale-105 z-50' : 'cursor-grab active:cursor-grabbing border border-transparent'}`}
      onClick={() => !isDragging && openEditModal(feature)}
    >
      {epic && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 rounded-full" style={{ background: epic.color }}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{epic.name}</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 tracking-widest uppercase">{feature.id}</span>
        <div className="flex gap-1.5 items-center">
          {feature.priority === 'Critical' && <Flame size={14} className="text-orange-500 animate-pulse" />}
          {isBlocked && <Lock size={12} className="text-slate-400" />}
          <ComplianceBadge status={feature.complianceStatus} />
        </div>
      </div>

      <h4 className="font-bold text-[#191c1e] dark:text-slate-100 text-[15px] mb-4 line-clamp-2 leading-[1.4] group-hover:text-[#24389c] dark:group-hover:text-indigo-400 transition-colors">{feature.title}</h4>

      {feature.dependencies?.length > 0 && (
        <div className="text-[9px] font-black text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full mb-4 inline-flex items-center gap-1.5 uppercase tracking-wider">
          <AlertTriangle size={10} /> {feature.dependencies.length} blockages
        </div>
      )}

      <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-[#f7f9fb] dark:bg-slate-800 text-[#24389c] dark:text-indigo-400 flex items-center justify-center text-[10px] font-black border border-white dark:border-slate-700 shadow-sm">
          {feature.assignee ? String(feature.assignee).substring(0, 2).toUpperCase() : 'UI'}
        </div>
        <div className="text-[10px] font-black text-[#24389c] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1.5 rounded-xl border border-[#24389c]/10 dark:border-none">
          RICE {feature.riceScore}
        </div>
      </div>
    </motion.div>
  );
}

function DroppableColumn({ id, features, openEditModal, epics, isOverValid, isOverInvalid, currentUser, flash }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const count = features.filter(f => f.status === id).length;

  let bgClass = 'bg-[#f7f9fb] dark:bg-slate-900/50';
  if (isOverValid) bgClass = 'bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-inset ring-indigo-200 dark:ring-indigo-500/20';
  else if (isOverInvalid) bgClass = 'bg-rose-50/50 dark:bg-rose-900/20 ring-2 ring-inset ring-rose-200 dark:ring-rose-500/20';
  else if (isOver) bgClass = 'bg-indigo-50/50 dark:bg-indigo-900/20';

  return (
    <div
      ref={setNodeRef}
      className={`relative flex-1 min-w-[320px] flex flex-col rounded-[2.5rem] p-4 transition-all duration-500 ${bgClass}`}
    >
      {/* Drop pulse overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute inset-0 rounded-[2.5rem] bg-emerald-400/15 pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      <div className="flex justify-between mb-6 px-4 py-2">
        <div className="flex items-center gap-3">
          <h3 className="font-black text-[#24389c] dark:text-indigo-400 text-[11px] uppercase tracking-[0.2em]">{id}</h3>
          {GATED_COLUMNS.includes(id) && (
            <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full flex items-center gap-1 uppercase">
              <ShieldAlert size={10} /> Validated
            </span>
          )}
        </div>
        <motion.span
          key={count}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.snappy}
          className="bg-white dark:bg-slate-800 text-[#24389c] dark:text-indigo-400 text-[11px] font-black px-3 py-1 rounded-full shadow-sm"
        >
          {count}
        </motion.span>
      </div>
      <div className="space-y-4 overflow-y-auto px-1 pb-16 custom-scrollbar flex-1 scroll-smooth">
        {features.filter(f => f.status === id).map(feature => (
          <DraggableCard key={feature.id} feature={feature} openEditModal={openEditModal} epics={epics} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}

export default function BoardView() {
  const { filteredFeatures: features, openEditModal, moveFeature, epics, currentUser } = useProject();
  const [activeId, setActiveId] = useState(null);
  const [gateError, setGateError] = useState(null);
  const [invalidDropTarget, setInvalidDropTarget] = useState(null);
  const [flashColumn, setFlashColumn] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeFeature = activeId ? features.find(f => f.id === activeId) : null;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setGateError(null);
    setInvalidDropTarget(null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !active) { setInvalidDropTarget(null); return; }

    const feature = features.find(f => f.id === active.id);
    const targetColumn = over.id;

    if (feature?.complianceStatus === 'Blocked' && GATED_COLUMNS.includes(targetColumn)) {
      setInvalidDropTarget(targetColumn);
    } else {
      setInvalidDropTarget(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setInvalidDropTarget(null);

    if (!over) return;

    const feature = features.find(f => f.id === active.id);
    const targetColumn = over.id;

    if (!feature || feature.status === targetColumn) return;

    if (feature.complianceStatus === 'Blocked' && GATED_COLUMNS.includes(targetColumn)) {
      setGateError({
        featureId: feature.id,
        featureTitle: feature.title,
        targetColumn,
        message: `Security Enforcement: "${feature.title}" is currently locked. Resolution in Compliance Guard required before state transition.`
      });
      return;
    }

    moveFeature(feature.id, targetColumn);
    setFlashColumn(targetColumn);
    setTimeout(() => setFlashColumn(null), 700);
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      {/* Hard-Gate Error Banner */}
      <AnimatePresence>
        {gateError && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 rounded-3xl p-6 flex items-start gap-5 shadow-2xl shadow-rose-200/20 dark:shadow-none relative z-50"
          >
            <motion.div
              className="p-3 bg-[#24389c] rounded-2xl text-white shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none"
              animate={{ rotate: [0, -5, 5, -3, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Lock size={20} />
            </motion.div>
            <div className="flex-1">
              <h4 className="text-[12px] font-black text-[#24389c] dark:text-indigo-300 uppercase tracking-widest">Protocol Restriction</h4>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{gateError.message}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-black uppercase tracking-widest">{gateError.featureId} // ACCESS DENIED</p>
            </div>
            <button
              onClick={() => setGateError(null)}
              className="text-slate-400 hover:text-[#24389c] dark:hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm"
            >
              Acknowledge
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DnD Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-8 flex-1 min-h-0 custom-scrollbar">
          {COLUMNS.map(col => (
            <DroppableColumn
              key={col}
              id={col}
              features={features}
              openEditModal={openEditModal}
              epics={epics}
              currentUser={currentUser}
              isOverValid={activeFeature && invalidDropTarget !== col && activeFeature.status !== col}
              isOverInvalid={invalidDropTarget === col}
              flash={flashColumn === col}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 300, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
          {activeFeature ? (
            <div className="w-[320px]">
              <DraggableCard feature={activeFeature} openEditModal={() => {}} epics={epics} isDragOverlay currentUser={currentUser} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
