import { useState, useMemo } from 'react';
import { 
  FileText, Heart, Trash2, Clock, Layout, ArrowRight,
  Pin, Archive, Search, Grid, List as ListIcon, Folder as FolderIcon, ChevronRight,
  FolderPlus, FolderInput, RotateCcw, UploadCloud
} from 'lucide-react';
import type { Document, Folder, TemplateId } from '../types';
import { TEMPLATES } from '../templates/presets';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  documents: Document[];
  folders: Folder[];
  onCreateDoc: (templateId: TemplateId, title?: string, folderId?: string | null) => void;
  onSelectDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePinned?: (id: string) => void;
  onToggleArchived?: (id: string) => void;
  onToggleTrash?: (id: string) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => void;
  onRenameFolder?: (folderId: string, name: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onShowToast?: (msg: string) => void;
}

const CATEGORIES = ['All', 'Resume', 'Invoice', 'Report'];

export default function LandingPage({
  documents,
  folders,
  onCreateDoc,
  onSelectDoc,
  onDeleteDoc,
  onToggleFavorite,
  onTogglePinned,
  onToggleArchived,
  onToggleTrash,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onShowToast
}: LandingPageProps) {
  const { accessToken } = useAuth();
  
  // Dashboard Tabs: 'recent' | 'pinned' | 'shared' | 'archive' | 'trash'
  const [activeTab, setActiveTab] = useState<'recent' | 'pinned' | 'shared' | 'archive' | 'trash'>('recent');
  
  // Layout States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const sortKey = 'updatedAt';
  const sortOrder = 'desc';
  const [templateCategory, setTemplateCategory] = useState('All');

  // Folder Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Drag & Drop / Upload progress States
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Home' }];
    if (!currentFolderId) return crumbs;

    let current = folders.find(f => f.id === currentFolderId);
    const path: { id: string | null; name: string }[] = [];
    
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      const parentId = current.parentId;
      current = parentId ? folders.find(f => f.id === parentId) : undefined;
    }
    
    return [...crumbs, ...path];
  }, [currentFolderId, folders]);

  // Filter folders in current level
  const currentFolders = folders.filter(f => f.parentId === currentFolderId);

  // Filter documents in current level and tab category
  const filteredDocuments = useMemo(() => {
    let docs = documents;

    // Filter by tab scopes
    if (activeTab === 'pinned') {
      docs = docs.filter(d => d.pinned && !d.trash && !d.archived);
    } else if (activeTab === 'archive') {
      docs = docs.filter(d => d.archived && !d.trash);
    } else if (activeTab === 'trash') {
      docs = docs.filter(d => d.trash);
    } else {
      // 'recent' scope - only show current directory contents and not trash/archived
      docs = docs.filter(d => d.folderId === currentFolderId && !d.trash && !d.archived);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
    }

    // Apply Sorting
    docs.sort((a, b) => {
      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';

      if (sortKey === 'updatedAt') {
        return sortOrder === 'desc' 
          ? new Date(valB).getTime() - new Date(valA).getTime()
          : new Date(valA).getTime() - new Date(valB).getTime();
      }

      if (valA.toString().toLowerCase() < valB.toString().toLowerCase()) return sortOrder === 'desc' ? 1 : -1;
      if (valA.toString().toLowerCase() > valB.toString().toLowerCase()) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    return docs;
  }, [documents, activeTab, currentFolderId, searchQuery, sortKey, sortOrder]);

  const handleCreateFolder = () => {
    const name = window.prompt('Enter folder name:');
    if (name && onCreateFolder) {
      onCreateFolder(name, currentFolderId);
      if (onShowToast) onShowToast('Created folder successfully');
    }
  };

  const handleRenameFolder = (folderId: string, oldName: string) => {
    const name = window.prompt('Rename folder to:', oldName);
    if (name && onRenameFolder) {
      onRenameFolder(folderId, name);
      if (onShowToast) onShowToast('Folder renamed');
    }
  };

  // Drag and Drop File Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDropFile = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.docx', '.txt', '.md', '.html'];

    if (!validExtensions.includes(extension)) {
      if (onShowToast) onShowToast('Unsupported file type. Drop .docx, .txt, .md or .html');
      return;
    }

    // Simulate progress bar during upload
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev !== null && prev < 90) return prev + 20;
        return prev;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/documents/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (res.ok) {
        const doc = await res.json();
        if (onShowToast) onShowToast(`Imported ${file.name} successfully!`);
        setTimeout(() => {
          onSelectDoc(doc.id);
        }, 300);
      } else {
        if (onShowToast) onShowToast('Import failed. Make sure server is running.');
      }
    } catch (e) {
      clearInterval(interval);
      if (onShowToast) onShowToast('Network error during file import.');
    } finally {
      setTimeout(() => setUploadProgress(null), 1000);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropFile}
      className="flex-1 bg-brand-bg-light dark:bg-brand-bg-dark transition-colors py-8 px-6 overflow-y-auto max-h-[calc(100vh-64px)] relative"
    >
      {/* Drag Over Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-sm border-2 border-dashed border-blue-500 z-50 flex flex-col items-center justify-center gap-4 text-blue-600 dark:text-blue-400 pointer-events-none">
          <UploadCloud size={64} className="animate-bounce" />
          <span className="font-heading font-extrabold text-xl">Drop files here to import into NovaDocs</span>
          <span className="text-xs text-slate-400">Supports Word (.docx), Markdown, HTML, and Text.</span>
        </div>
      )}

      {/* Upload Progress Loader */}
      {uploadProgress !== null && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl z-50 w-72 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5"><Clock size={12}/> Importing Document...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-800 dark:text-white tracking-tight mb-3">
          Pro-Grade <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Collaborative Editor</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Upload existing DOCX, Markdown or HTML files. Sync structures, collaborate inside document templates, and organize everything into nested folders.
        </p>
      </div>

      {/* Dashboard Top Filters & Tab Navigation bar */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl gap-0.5 text-xs font-semibold text-slate-500">
          <button 
            onClick={() => { setActiveTab('recent'); setCurrentFolderId(null); }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'recent' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : ''}`}
          >
            <Clock size={13} />
            <span>Files</span>
          </button>
          <button 
            onClick={() => setActiveTab('pinned')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'pinned' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : ''}`}
          >
            <Pin size={13} />
            <span>Pinned</span>
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'archive' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : ''}`}
          >
            <Archive size={13} />
            <span>Archive</span>
          </button>
          <button 
            onClick={() => setActiveTab('trash')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'trash' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : ''}`}
          >
            <Trash2 size={13} />
            <span>Trash</span>
          </button>
        </div>

        {/* Search & Sort Panel */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60 flex items-center">
            <Search className="absolute left-3 text-slate-400" size={13} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 border border-slate-205 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs outline-none focus:border-blue-500 text-slate-850 dark:text-slate-100 transition-colors"
            />
          </div>

          <button 
            onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            className="p-2 border border-slate-205 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            title={viewMode === 'grid' ? 'List View' : 'Grid View'}
          >
            {viewMode === 'grid' ? <ListIcon size={14} /> : <Grid size={14} />}
          </button>
        </div>
      </div>

      {/* Main explorer contents */}
      <div className="max-w-5xl mx-auto mb-10">
        
        {/* Navigation Breadcrumbs for Folder Structure */}
        {activeTab === 'recent' && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id || 'root'} className="flex items-center">
                  {idx > 0 && <ChevronRight size={12} className="text-slate-350 mx-1" />}
                  <button 
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleCreateFolder}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 py-1.5 px-3 rounded-lg hover:opacity-90 cursor-pointer"
              >
                <FolderPlus size={12} />
                <span>New Folder</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty States check */}
        {currentFolders.length === 0 && filteredDocuments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText size={32} />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <span className="font-bold text-slate-800 dark:text-white">Workspace is clean</span>
              <span className="text-xs text-slate-400">Create a blank document, folders or drag & drop files (.docx, .md, .txt) directly here.</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* 1. Folder Grid Display (only inside active recents files tab) */}
            {activeTab === 'recent' && currentFolders.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Folders</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentFolders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FolderIcon size={18} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{folder.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder.id, folder.name); }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          title="Rename Folder"
                        >
                          <FolderInput size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this folder and all sub-contents?')) onDeleteFolder?.(folder.id); }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          title="Delete Folder"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Documents Grid / List view */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Documents</span>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredDocuments.map(doc => {
                    const templateName = TEMPLATES.find(t => t.id === doc.template)?.name || 'Blank';
                    return (
                      <div
                        key={doc.id}
                        onClick={() => onSelectDoc(doc.id)}
                        className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between group h-36"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                              <FileText size={16} />
                            </div>
                            <div className="flex flex-col truncate max-w-[150px]">
                              <span className="text-xs font-bold text-slate-850 dark:text-white truncate">{doc.title}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{templateName}</span>
                            </div>
                          </div>
                          
                          {/* File Actions options overlay */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {activeTab === 'trash' ? (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onToggleTrash?.(doc.id); }}
                                  className="p-1 rounded text-slate-400 hover:text-green-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Restore Document"
                                >
                                  <RotateCcw size={13} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); if (confirm('Permanently delete this document? This cannot be undone.')) onDeleteDoc(doc.id); }}
                                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Permanently Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onTogglePinned?.(doc.id); }}
                                  className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${doc.pinned ? 'text-amber-500' : 'text-slate-400'}`}
                                  title={doc.pinned ? 'Unpin Document' : 'Pin Document'}
                                >
                                  <Pin size={13} className={doc.pinned ? 'fill-amber-500' : ''} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(doc.id); }}
                                  className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${doc.favorite ? 'text-red-500' : 'text-slate-400'}`}
                                  title="Favorite"
                                >
                                  <Heart size={13} className={doc.favorite ? 'fill-red-500' : ''} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onToggleArchived?.(doc.id); }}
                                  className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Archive"
                                >
                                  <Archive size={13} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onToggleTrash?.(doc.id); }}
                                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Move to Trash"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-850 pt-2.5">
                          <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(doc.updatedAt)}</span>
                          {doc.folderId && (
                            <span className="flex items-center gap-0.5"><FolderIcon size={10} className="text-blue-550"/> Folder</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // List Mode layout
                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-150 dark:border-slate-850">
                    <span className="col-span-6">Name</span>
                    <span className="col-span-3">Last Modified</span>
                    <span className="col-span-2">Template</span>
                    <span className="col-span-1 text-right">Actions</span>
                  </div>
                  <div className="flex flex-col">
                    {filteredDocuments.map(doc => {
                      const templateName = TEMPLATES.find(t => t.id === doc.template)?.name || 'Blank';
                      return (
                        <div
                          key={doc.id}
                          onClick={() => onSelectDoc(doc.id)}
                          className="grid grid-cols-12 px-4 py-3 border-b border-slate-100 dark:border-slate-850/60 items-center hover:bg-slate-50 dark:hover:bg-slate-850/40 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors group"
                        >
                          <div className="col-span-6 flex items-center gap-2 truncate">
                            <FileText size={14} className="text-slate-400" />
                            <span className="truncate">{doc.title}</span>
                          </div>
                          <span className="col-span-3 text-slate-400 font-normal">{formatDate(doc.updatedAt)}</span>
                          <span className="col-span-2 text-slate-400 font-normal">{templateName}</span>
                          <div className="col-span-1 flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onToggleFavorite(doc.id); }} 
                              className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${doc.favorite ? 'text-red-500' : 'text-slate-400'}`}
                            >
                              <Heart size={12} className={doc.favorite ? 'fill-red-500' : ''} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onToggleTrash?.(doc.id); }}
                              className="p-1 rounded text-slate-450 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Templates Catalog Gallery catalog view */}
      {activeTab === 'recent' && !currentFolderId && (
        <div id="templates-catalog" className="max-w-5xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Layout size={18} className="text-blue-500" />
              <span>Start from a Layout Template</span>
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-850 p-0.5 rounded-lg gap-0.5 text-[10px] font-bold">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setTemplateCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${templateCategory === cat ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TEMPLATES.filter(t => templateCategory === 'All' || t.category === templateCategory).slice(0, 3).map(template => {
              return (
                <div
                  key={template.id}
                  onClick={() => onCreateDoc(template.id, undefined, currentFolderId)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-600 hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-36"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{template.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{template.description}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 border-t border-slate-100 dark:border-slate-850 pt-2.5">
                    <span>Create Copy</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
