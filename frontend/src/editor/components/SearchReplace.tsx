import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react';

interface SearchReplaceProps {
  editor: Editor | null;
  onClose: () => void;
}

export default function SearchReplace({ editor, onClose }: SearchReplaceProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (!editor) return;
    
    // Register current find text in editor extension storage
    editor.commands.setSearchTerm(findText);

    // Sync count from extension storage
    const results = (editor.storage as any).searchReplace?.results || [];
    const index = (editor.storage as any).searchReplace?.currentIndex ?? -1;
    
    setMatchCount(results.length);
    setCurrentIndex(index);
  }, [findText, editor]);

  // Sync results when the document content updates
  useEffect(() => {
    if (!editor) return;
    
    const handleUpdate = () => {
      const results = (editor.storage as any).searchReplace?.results || [];
      const index = (editor.storage as any).searchReplace?.currentIndex ?? -1;
      setMatchCount(results.length);
      setCurrentIndex(index);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  const handleFindNext = () => {
    if (editor) {
      editor.commands.nextSearchMatch();
      setCurrentIndex((editor.storage as any).searchReplace?.currentIndex ?? -1);
    }
  };

  const handleFindPrev = () => {
    if (editor) {
      editor.commands.prevSearchMatch();
      setCurrentIndex((editor.storage as any).searchReplace?.currentIndex ?? -1);
    }
  };

  const handleReplace = () => {
    if (editor) {
      editor.commands.replace(replaceText);
      // Update count & active index
      const results = (editor.storage as any).searchReplace?.results || [];
      const index = (editor.storage as any).searchReplace?.currentIndex ?? -1;
      setMatchCount(results.length);
      setCurrentIndex(index);
    }
  };

  const handleReplaceAll = () => {
    if (editor) {
      editor.commands.replaceAll(replaceText);
      setMatchCount(0);
      setCurrentIndex(-1);
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 z-30 flex flex-col gap-2 min-w-[280px] text-xs text-slate-700 dark:text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Title / Close */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
        <span className="font-bold flex items-center gap-1.5">
          <Search size={14} className="text-blue-500" />
          Find and Replace
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={14} />
        </button>
      </div>

      {/* Find Input */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-slate-500">Find</label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Text to find..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2 py-1.5 pr-14 rounded-lg outline-none focus:border-blue-500 font-medium"
            autoFocus
          />
          {findText && (
            <span className="absolute right-2 text-[10px] font-semibold text-slate-400">
              {matchCount > 0 ? `${currentIndex + 1}/${matchCount}` : '0/0'}
            </span>
          )}
        </div>
      </div>

      {/* Replace Input */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold text-slate-500">Replace with</label>
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replacement text..."
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2 py-1.5 rounded-lg outline-none focus:border-blue-500 font-medium"
        />
      </div>

      {/* Navigation & Replace Buttons */}
      <div className="flex items-center gap-1 mt-1">
        {/* Next/Prev Nav */}
        <button
          onClick={handleFindPrev}
          disabled={matchCount === 0}
          className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
          title="Previous Match"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={handleFindNext}
          disabled={matchCount === 0}
          className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 mr-2"
          title="Next Match"
        >
          <ChevronUp size={14} />
        </button>

        {/* Action buttons */}
        <button
          onClick={handleReplace}
          disabled={matchCount === 0}
          className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 font-semibold py-1.5 rounded disabled:opacity-30"
        >
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={matchCount === 0}
          className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 font-semibold py-1.5 rounded disabled:opacity-30"
        >
          All
        </button>
      </div>
    </div>
  );
}
