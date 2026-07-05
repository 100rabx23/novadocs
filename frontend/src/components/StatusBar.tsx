import { useState } from 'react';
import { 
  ZoomIn, ZoomOut, BarChart2, Clock, ChevronUp
} from 'lucide-react';

interface StatusBarProps {
  content: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}

export default function StatusBar({
  content,
  zoom,
  onZoomChange,
  saveStatus
}: StatusBarProps) {
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  // Helper to extract statistics from HTML content
  const getStats = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
    const charCount = text.length;
    const paragraphs = tempDiv.getElementsByTagName('p').length || (text.trim() ? 1 : 0);
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute average

    return { wordCount, charCount, paragraphs, readingTime };
  };

  const { wordCount, charCount, paragraphs, readingTime } = getStats();

  const ZOOM_OPTIONS = [50, 75, 100, 125, 150];

  return (
    <footer className="h-10 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 px-4 flex items-center justify-between select-none transition-colors">
      {/* Word Count / Metrics */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Word Count">
          <BarChart2 size={13} className="text-slate-400" />
          <span><strong>{wordCount}</strong> words</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5" title="Character Count">
          <span><strong>{charCount}</strong> characters</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5" title="Paragraphs">
          <span><strong>{paragraphs}</strong> paragraphs</span>
        </div>
        <div className="flex items-center gap-1.5" title="Estimated Reading Time">
          <Clock size={13} className="text-slate-400" />
          <span><strong>{readingTime}</strong> {readingTime === 1 ? 'min' : 'mins'} read</span>
        </div>
      </div>

      {/* Save indicator & Zoom controls */}
      <div className="flex items-center gap-3">
        {/* Save indicator */}
        <span className="hidden sm:inline-block text-[10px] bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
          Autosave: {saveStatus === 'saved' ? 'Synced' : saveStatus === 'saving' ? 'Syncing...' : 'Pending'}
        </span>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Zoom Controls */}
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => onZoomChange(Math.max(50, zoom - 25))}
            disabled={zoom <= 50}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-0.5"
            title="Zoom Options"
          >
            <span>{zoom}%</span>
            <ChevronUp size={10} />
          </button>
          
          <button
            onClick={() => onZoomChange(Math.min(150, zoom + 25))}
            disabled={zoom >= 150}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>

          {showZoomMenu && (
            <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-30 min-w-[90px] flex flex-col">
              {ZOOM_OPTIONS.map(z => (
                <button
                  key={z}
                  onClick={() => {
                    onZoomChange(z);
                    setShowZoomMenu(false);
                  }}
                  className={`w-full text-center px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] ${zoom === z ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}
                >
                  {z}%
                </button>
              ))}
              <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
              <button
                onClick={() => {
                  onZoomChange(100);
                  setShowZoomMenu(false);
                }}
                className="w-full text-center px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
              >
                Reset (100%)
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
