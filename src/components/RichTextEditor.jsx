import React, { useRef, useCallback } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2,
  Table, Minus, Undo, Redo, AlignLeft, AlignCenter, Code, Quote
} from 'lucide-react';

// --- Toolbar Button ---
function ToolbarBtn({ icon: Icon, label, active, onClick, disabled }) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-all ${
        active ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300'
      } ${disabled ? 'opacity-30 cursor-default' : 'cursor-pointer'}`}
    >
      <Icon size={14} />
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  const exec = useCallback((command, val = null) => {
    document.execCommand(command, false, val);
    // Trigger onChange with updated HTML
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertTable = useCallback(() => {
    const table = `<table style="border-collapse:collapse;width:100%;margin:8px 0"><thead><tr>${
      '<th style="border:1px solid #e2e8f0;padding:6px 10px;background:#f8fafc;text-align:left;font-size:12px">Column</th>'.repeat(3)
    }</tr></thead><tbody><tr>${
      '<td style="border:1px solid #e2e8f0;padding:6px 10px;font-size:12px">&nbsp;</td>'.repeat(3)
    }</tr><tr>${
      '<td style="border:1px solid #e2e8f0;padding:6px 10px;font-size:12px">&nbsp;</td>'.repeat(3)
    }</tr></tbody></table><p><br></p>`;
    exec('insertHTML', table);
  }, [exec]);

  // Set initial content
  React.useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      // Only set if truly different (avoid cursor jump)
      const current = editorRef.current.innerHTML;
      if (current === '' || current === '<br>') {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  return (
    <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-300 dark:focus-within:ring-indigo-500/50 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-wrap">
        <ToolbarBtn icon={Bold} label="Bold" onClick={() => exec('bold')} />
        <ToolbarBtn icon={Italic} label="Italic" onClick={() => exec('italic')} />
        <ToolbarBtn icon={Underline} label="Underline" onClick={() => exec('underline')} />
        <ToolbarBtn icon={Code} label="Code" onClick={() => exec('formatBlock', 'pre')} />
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
        <ToolbarBtn icon={Heading1} label="Heading 1" onClick={() => exec('formatBlock', 'h2')} />
        <ToolbarBtn icon={Heading2} label="Heading 2" onClick={() => exec('formatBlock', 'h3')} />
        <ToolbarBtn icon={Quote} label="Blockquote" onClick={() => exec('formatBlock', 'blockquote')} />
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
        <ToolbarBtn icon={List} label="Bullet List" onClick={() => exec('insertUnorderedList')} />
        <ToolbarBtn icon={ListOrdered} label="Numbered List" onClick={() => exec('insertOrderedList')} />
        <ToolbarBtn icon={AlignLeft} label="Align Left" onClick={() => exec('justifyLeft')} />
        <ToolbarBtn icon={AlignCenter} label="Align Center" onClick={() => exec('justifyCenter')} />
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
        <ToolbarBtn icon={Table} label="Insert Table" onClick={insertTable} />
        <ToolbarBtn icon={Minus} label="Divider" onClick={() => exec('insertHorizontalRule')} />
        <div className="flex-1" />
        <ToolbarBtn icon={Undo} label="Undo" onClick={() => exec('undo')} />
        <ToolbarBtn icon={Redo} label="Redo" onClick={() => exec('redo')} />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder || 'Write your PRD here...'}
        className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 text-sm text-slate-800 dark:text-slate-100 outline-none leading-relaxed custom-scrollbar prose-editor"
      />
    </div>
  );
}
