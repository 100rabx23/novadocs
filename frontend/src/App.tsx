import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DocumentSidebar from './sidebar/components/DocumentSidebar';
import LandingPage from './pages/LandingPage';
import TiptapEditor from './editor/components/TiptapEditor';
import EditorToolbar from './toolbar/components/EditorToolbar';
import StatusBar from './components/StatusBar';
import SearchReplace from './editor/components/SearchReplace';
import CommandPalette from './components/CommandPalette';
import { SettingsModal, AboutModal } from './components/Modals';
import SlashCommandsMenu from './editor/components/SlashCommandsMenu';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import EditorRightSidebar from './editor/components/EditorRightSidebar';

import { useDocs } from './hooks/useDocs';
import { exportToDocx } from './lib/exportDocx';
import type { TemplateId } from './types';
import { Sparkles, X, Layout } from 'lucide-react';

export default function App() {
  const { user, accessToken, loading, logout, isAuthenticated } = useAuth();

  const {
    documents,
    folders,
    activeDoc,
    activeDocId,
    setActiveDocId,
    createDocument,
    updateTitle,
    updateContent,
    deleteDocument,
    toggleFavorite,
    togglePinned,
    toggleArchived,
    toggleTrash,
    createFolder,
    renameFolder,
    deleteFolder,
    moveDocToFolder,
    closeEditor,
    
    // Comments
    comments,
    addComment,
    resolveComment,

    // Versions
    versions,
    createVersionSnapshot,
    restoreVersionSnapshot,

    // Shares
    shares,
    shareDoc,
    removeShare,
    
    // Theme
    theme,
    toggleTheme,
    
    // Zoom
    zoom,
    setZoom,
    
    // UI Panel States
    isSidebarOpen,
    setIsSidebarOpen,
    saveStatus,
    setSaveStatus,
    showTemplatesGallery,
    setShowTemplatesGallery,
    showSettings,
    setShowSettings,
    showAbout,
    setShowAbout,
    isOnline,
  } = useDocs(accessToken);

  // Active Editor and Search/Replace state
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [outline, setOutline] = useState<{ text: string; level: number; index: number }[]>([]);
  
  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to trigger toast messages
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Heading scroll handler
  const handleHeadingClick = (index: number) => {
    const headings = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3');
    if (headings[index]) {
      headings[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // DOCX Export trigger
  const handleExport = async () => {
    if (!activeDoc) return;
    showToast('Preparing document export...');
    try {
      await exportToDocx(activeDoc.title, activeDoc.content);
      showToast('Document exported successfully!');
    } catch (e) {
      console.error(e);
      showToast('Export failed. Check console for details.');
    }
  };

  // Clear all cache handler
  const handleClearAllDocs = () => {
    localStorage.removeItem('novadocs_documents');
    window.location.reload();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Ctrl+S: Save
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSaveStatus('saving');
        setTimeout(() => {
          setSaveStatus('saved');
          showToast('Document progress autosaved.');
        }, 500);
      }

      // Ctrl+F: Search
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }

      // Ctrl+K: Command Palette
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // Ctrl+P: Print
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  // Command palette actions map
  const handleCommandAction = (action: string, param?: any) => {
    switch (action) {
      case 'new-blank':
        createDocument('blank');
        showToast('Created new document.');
        break;
      case 'template-resume':
      case 'template-invoice':
      case 'template-report':
        createDocument(param as TemplateId);
        showToast(`Created document from template.`);
        break;
      case 'toggle-theme':
        toggleTheme();
        showToast(`Switched theme.`);
        break;
      case 'export-docx':
        handleExport();
        break;
      case 'find-replace':
        setIsSearchOpen(true);
        break;
      case 'reset-zoom':
        setZoom(100);
        showToast('Zoom reset.');
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'about':
        setShowAbout(true);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onShowToast={(msg) => showToast(msg)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-900 transition-colors overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <Navbar
        activeDoc={activeDoc}
        saveStatus={saveStatus}
        theme={theme}
        toggleTheme={toggleTheme}
        onCloseEditor={closeEditor}
        onRename={(title) => activeDocId && updateTitle(activeDocId, title)}
        onExport={handleExport}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(!isSearchOpen)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        user={user}
        onLogout={logout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        {isSidebarOpen && (
          <DocumentSidebar
            documents={documents}
            folders={folders}
            activeDocId={activeDocId}
            onSelectDoc={setActiveDocId}
            onCreateDoc={(id, title, folderId) => {
              createDocument(id, title, folderId);
              showToast('New document created.');
            }}
            onDeleteDoc={deleteDocument}
            onToggleFavorite={toggleFavorite}
            onTogglePinned={togglePinned}
            onToggleArchived={toggleArchived}
            onToggleTrash={toggleTrash}
            onCreateFolder={createFolder}
            onMoveDocToFolder={moveDocToFolder}
            outline={outline}
            onHeadingClick={handleHeadingClick}
            onOpenSettings={() => setShowSettings(true)}
            onOpenAbout={() => setShowAbout(true)}
            onOpenTemplates={() => setShowTemplatesGallery(true)}
            isOnline={isOnline}
          />
        )}

        {/* Content Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeDoc ? (
            // Editor Workspace Mode with side-by-side Right Sidebar
            <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors relative">
              {/* Central Editor Area */}
              <div className="flex-1 flex flex-col overflow-hidden h-full relative">
                {/* Rich text formatting toolbar */}
                <EditorToolbar editor={editorInstance} onExport={handleExport} />
                
                {/* Scrollable sheet content */}
                <div className="flex-1 overflow-y-auto px-4 relative">
                  <TiptapEditor
                    key={activeDoc.id}
                    content={activeDoc.content}
                    onChange={(html) => updateContent(activeDoc.id, html)}
                    onOutlineChange={setOutline}
                    setEditorInstance={setEditorInstance}
                    zoom={zoom}
                  />
                  
                  <SlashCommandsMenu editor={editorInstance} />
                  
                  {/* Search overlay inside editor */}
                  {isSearchOpen && (
                    <SearchReplace
                      editor={editorInstance}
                      onClose={() => {
                        setIsSearchOpen(false);
                        if (editorInstance) {
                          editorInstance.commands.setSearchTerm('');
                        }
                      }}
                    />
                  )}
                </div>
                
                {/* StatusBar metrics */}
                <StatusBar
                  content={activeDoc.content}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  saveStatus={saveStatus}
                />
              </div>

              {/* Right Sidebar Panel */}
              <EditorRightSidebar
                docId={activeDoc.id}
                comments={comments}
                onAddComment={addComment}
                onResolveComment={resolveComment}
                versions={versions}
                onCreateVersion={createVersionSnapshot}
                onRestoreVersion={restoreVersionSnapshot}
                shares={shares}
                onShareDoc={shareDoc}
                onRemoveShare={removeShare}
                editor={editorInstance}
              />
            </div>
          ) : (
            // Landing Dashboard Mode
            <LandingPage
              documents={documents}
              folders={folders}
              onCreateDoc={(id, title, folderId) => {
                createDocument(id, title, folderId);
                showToast('New document created.');
              }}
              onSelectDoc={setActiveDocId}
              onDeleteDoc={deleteDocument}
              onToggleFavorite={toggleFavorite}
              onTogglePinned={togglePinned}
              onToggleArchived={toggleArchived}
              onToggleTrash={toggleTrash}
              onCreateFolder={createFolder}
              onRenameFolder={renameFolder}
              onDeleteFolder={deleteFolder}
              onShowToast={(msg) => showToast(msg)}
            />
          )}
        </main>
      </div>

      {/* Global Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles size={14} className="text-blue-400 dark:text-blue-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Templates Catalog Modal overlay */}
      {showTemplatesGallery && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-850">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Layout size={15} />
                Templates Catalog Gallery
              </span>
              <button onClick={() => setShowTemplatesGallery(false)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <LandingPage
                documents={[]} // empty list hides recent docs card inside preview
                folders={[]}
                onCreateDoc={(id) => {
                  createDocument(id);
                  setShowTemplatesGallery(false);
                  showToast('Created template document.');
                }}
                onSelectDoc={() => {}}
                onDeleteDoc={() => {}}
                onToggleFavorite={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal Dialog */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onClearAll={handleClearAllDocs}
        documentsCount={documents.length}
      />

      {/* About & Shortcuts Dialog */}
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />

      {/* Spotlight Command Palette Dialog */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onAction={handleCommandAction}
        isDocActive={!!activeDoc}
      />
    </div>
  );
}
