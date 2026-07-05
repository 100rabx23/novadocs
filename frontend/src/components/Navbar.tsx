import { useState, useEffect } from 'react';
import { 
  Search, Moon, Sun, Download, Menu, ArrowLeft, Check, Edit2, Sparkles
} from 'lucide-react';
import type { Document } from '../types';

interface NavbarProps {
  activeDoc: Document | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onCloseEditor: () => void;
  onRename: (title: string) => void;
  onExport: () => void;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenCommandPalette: () => void;
  user?: any;
  onLogout?: () => void;
}

export default function Navbar({
  activeDoc,
  saveStatus,
  theme,
  toggleTheme,
  onCloseEditor,
  onRename,
  onExport,
  onToggleSidebar,
  onOpenSearch,
  onOpenCommandPalette,
  user,
  onLogout
}: NavbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    if (activeDoc) {
      setTempTitle(activeDoc.title);
    }
  }, [activeDoc]);

  const handleTitleSubmit = () => {
    if (tempTitle.trim() && activeDoc) {
      onRename(tempTitle);
      setIsEditingTitle(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      if (activeDoc) setTempTitle(activeDoc.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <nav className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 transition-colors">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle for active editors */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200"
          title="Toggle Navigation / Outline"
        >
          <Menu size={20} />
        </button>

        {/* Back Arrow or Logo */}
        {activeDoc ? (
          <button
            onClick={onCloseEditor}
            className="flex items-center gap-1.5 p-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            title="Back to Landing Screen"
          >
            <ArrowLeft size={16} />
            <span className="hidden md:inline">Dashboard</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 cursor-pointer" onClick={onCloseEditor}>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm tracking-tight text-slate-800 dark:text-white">NovaDocs</span>
              <span className="text-[10px] font-medium text-slate-400">Create. Edit. Export.</span>
            </div>
          </div>
        )}

        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />

        {/* Document Title (Editable) */}
        {activeDoc && (
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium px-2.5 py-1 text-sm rounded-lg border border-blue-500 outline-none w-48 md:w-64 transition-all"
                />
                <button 
                  onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                  onClick={handleTitleSubmit} 
                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg cursor-pointer transition-all truncate max-w-[150px] sm:max-w-[240px] md:max-w-[320px]"
                >
                  {activeDoc.title}
                </h1>
                <button 
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-opacity"
                  title="Rename Document"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}

            {/* Autosave badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 transition-colors">
              <span className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' :
                saveStatus === 'saved' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="hidden sm:inline">
                {saveStatus === 'saving' ? 'Saving...' :
                 saveStatus === 'saved' ? 'Saved' : 'Unsaved Changes'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-all font-medium"
          title="Open Command Palette (Ctrl+K)"
        >
          <span>Search command...</span>
          <kbd className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px] font-mono">Ctrl+K</kbd>
        </button>

        {/* Find/Replace Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
          title="Find and Replace (Ctrl+F)"
        >
          <Search size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Export Button (only visible when editor is active) */}
        {activeDoc && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02]"
            title="Download Word Document"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* User avatar mockup */}
        <div 
          onClick={onLogout}
          title={user ? `Log out (${user.name})` : 'Log out'}
          className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden shadow-inner hover:opacity-80 transition-opacity"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-[10px] text-blue-600 dark:text-blue-400">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
