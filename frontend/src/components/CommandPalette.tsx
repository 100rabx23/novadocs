import { useState, useEffect, useRef } from 'react';
import { 
  Search, FileText, Layout, Moon, Download, Settings, Info, Sparkles, Terminal
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, param?: any) => void;
  isDocActive: boolean;
}

export default function CommandPalette({ isOpen, onClose, onAction, isDocActive }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Command items
  const commands = [
    { id: 'new-blank', title: 'Create New Blank Document', icon: FileText, category: 'Creation' },
    { id: 'template-resume', title: 'Create Modern Resume', icon: Layout, category: 'Templates', param: 'resume-modern' },
    { id: 'template-invoice', title: 'Create Business Invoice', icon: Layout, category: 'Templates', param: 'invoice-business' },
    { id: 'template-report', title: 'Create Strategic Report', icon: Layout, category: 'Templates', param: 'report-business' },
    { id: 'toggle-theme', title: 'Toggle Dark / Light Mode', icon: Moon, category: 'System' },
    ...(isDocActive ? [
      { id: 'export-docx', title: 'Export Document as DOCX', icon: Download, category: 'Active Document' },
      { id: 'find-replace', title: 'Open Find and Replace Search', icon: Search, category: 'Active Document' },
      { id: 'reset-zoom', title: 'Reset Editor Zoom to 100%', icon: Sparkles, category: 'Active Document' }
    ] : []),
    { id: 'settings', title: 'Open Settings Dialog', icon: Settings, category: 'System' },
    { id: 'about', title: 'Open About & Shortcuts Info', icon: Info, category: 'System' },
  ];

  // Filter commands by query
  const filtered = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          const cmd = filtered[selectedIndex];
          onAction(cmd.id, cmd.param);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onAction, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[400px] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-2.5 px-3 py-3 border-b border-slate-100 dark:border-slate-850">
          <Terminal size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search action..."
            className="w-full bg-transparent outline-none border-none text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 font-medium"
          />
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">ESC</span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-1.5">
              <span>No commands found matching "{query}"</span>
            </div>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              const isSelected = i === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    onAction(cmd.id, cmd.param);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/10' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                    <span>{cmd.title}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
