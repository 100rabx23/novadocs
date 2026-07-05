import { X, Moon, Sun, Keyboard, ShieldAlert, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onClearAll: () => void;
  documentsCount: number;
}

export function SettingsModal({ isOpen, onClose, theme, onToggleTheme, onClearAll, documentsCount }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-700 dark:text-slate-200 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-850">
          <span className="text-sm font-bold flex items-center gap-1.5">Settings</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Theme Option */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-100">Interface Appearance</span>
              <span className="text-[10px] text-slate-400">Toggle between Light and Dark interface modes.</span>
            </div>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-lg font-semibold transition-all"
            >
              {theme === 'light' ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-blue-400" />}
              <span className="capitalize">{theme} Mode</span>
            </button>
          </div>

          <div className="h-[1px] bg-slate-150 dark:bg-slate-800" />

          {/* Caching/Stats Option */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-100">Local Caching Statistics</span>
              <span className="text-[10px] text-slate-400">Total documents stored inside local storage.</span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-855 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/40">
              {documentsCount} {documentsCount === 1 ? 'document' : 'documents'}
            </span>
          </div>

          <div className="h-[1px] bg-slate-150 dark:bg-slate-800" />

          {/* Danger Zone */}
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/55 dark:border-red-900/35 rounded-xl flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-red-700 dark:text-red-400">Danger Zone</span>
                <span className="text-[10px] text-red-600/80 dark:text-red-400/70">Clearing cache will delete all local files permanently. Export your documents before clearing.</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you absolutely sure you want to delete ALL documents? This action is irreversible.')) {
                  onClearAll();
                }
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-all"
            >
              Clear Cache & Delete All Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { keys: 'Ctrl + B', action: 'Bold Text Formatting' },
    { keys: 'Ctrl + I', action: 'Italic Text Formatting' },
    { keys: 'Ctrl + U', action: 'Underline Text Formatting' },
    { keys: 'Ctrl + Z', action: 'Undo Last Action' },
    { keys: 'Ctrl + Shift + Z', action: 'Redo Action' },
    { keys: 'Ctrl + F', action: 'Toggle Find and Replace' },
    { keys: 'Ctrl + K', action: 'Open Command Palette' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-700 dark:text-slate-200 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-850">
          <span className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-500" />
            About NovaDocs
          </span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 max-h-[420px] overflow-y-auto">
          <div className="flex flex-col gap-1.5 text-center items-center py-2">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles size={24} />
            </div>
            <span className="font-heading font-extrabold text-base tracking-tight text-slate-800 dark:text-white">NovaDocs Editor</span>
            <span className="text-[10px] text-slate-400 font-medium">Create. Edit. Export. v1.0.0</span>
          </div>

          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-center px-2">
            NovaDocs is a premium rich-text editor designed to simplify document authoring. Built entirely as a frontend application, it securely saves drafts locally and enables exporting documents into Microsoft Word formats.
          </p>

          <div className="h-[1px] bg-slate-150 dark:bg-slate-800" />

          {/* Keyboard shortcuts list */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <Keyboard size={13} />
              <span>Keyboard Shortcuts</span>
            </span>
            
            <div className="flex flex-col border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-800">
              {SHORTCUTS.map(sc => (
                <div key={sc.keys} className="flex justify-between items-center py-2 px-3 bg-slate-50/50 dark:bg-slate-900/30">
                  <span className="font-medium text-slate-600 dark:text-slate-350">{sc.action}</span>
                  <kbd className="bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 dark:text-slate-300 font-mono">
                    {sc.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
