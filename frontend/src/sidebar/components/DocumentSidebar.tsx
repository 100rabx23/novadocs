import { useState } from 'react';
import { 
  Plus, FileText, Layout, Settings, Info, Hash, Trash2, Heart, Folder as FolderIcon,
  ChevronDown, ChevronRight, Pin, Cloud, HardDrive, FolderPlus
} from 'lucide-react';
import type { Document, Folder, TemplateId } from '../../types';

interface DocumentSidebarProps {
  documents: Document[];
  folders: Folder[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: (templateId: TemplateId, title?: string, folderId?: string | null) => void;
  onDeleteDoc: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePinned?: (id: string) => void;
  onToggleArchived?: (id: string) => void;
  onToggleTrash?: (id: string) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => void;
  onMoveDocToFolder?: (docId: string, folderId: string | null) => void;
  outline: { text: string; level: number; index: number }[];
  onHeadingClick: (index: number) => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenTemplates: () => void;
  isOnline?: boolean;
}

export default function DocumentSidebar({
  documents,
  folders,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onCreateFolder,
  onMoveDocToFolder,
  outline,
  onHeadingClick,
  onOpenSettings,
  onOpenAbout,
  onOpenTemplates,
  isOnline = true,
}: DocumentSidebarProps) {
  // Navigation lists expansion
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [showFoldersTree, setShowFoldersTree] = useState(true);

  // Toggle Folder expansion state
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Group root documents (docs that aren't in any folder, and not in trash/archive)
  const rootDocs = documents.filter(d => !d.folderId && !d.trash && !d.archived);
  const favoriteDocs = documents.filter(d => d.favorite && !d.trash && !d.archived);
  const pinnedDocs = documents.filter(d => d.pinned && !d.trash && !d.archived);
  const trashedDocs = documents.filter(d => d.trash);

  // Calculate used storage: each character is ~1 byte, total capacity represents 50MB
  const characterCount = documents.reduce((acc, doc) => acc + doc.content.length + doc.title.length, 0);
  const usedStorageBytes = characterCount * 1.5; // conversion factor
  const storagePercentage = Math.min(100, (usedStorageBytes / (50 * 1024 * 1024)) * 100);

  const handleCreateFolderClick = () => {
    const name = window.prompt('Enter folder name:');
    if (name && onCreateFolder) {
      onCreateFolder(name);
    }
  };

  // Drag over handler to support folder move
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnFolder = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData('text/plain');
    if (docId && onMoveDocToFolder) {
      onMoveDocToFolder(docId, folderId);
    }
  };

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData('text/plain', docId);
  };

  // Render a folder node recursively
  const renderFolderNode = (folder: Folder, depth = 0) => {
    const isExpanded = !!expandedFolders[folder.id];
    const folderDocs = documents.filter(d => d.folderId === folder.id && !d.trash && !d.archived);
    const subDirs = folders.filter(f => f.parentId === folder.id);

    return (
      <div 
        key={folder.id} 
        className="flex flex-col select-none"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnFolder(e, folder.id)}
      >
        {/* Folder Header */}
        <div 
          onClick={(e) => toggleFolderExpand(folder.id, e)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className="group flex items-center justify-between rounded-lg py-1.5 pr-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-1.5 truncate">
            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            <FolderIcon size={14} className="text-blue-500 fill-blue-500/20" />
            <span className="truncate">{folder.name}</span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateDoc('blank', undefined, folder.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-350 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Create Document inside folder"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Folder Content children */}
        {isExpanded && (
          <div className="flex flex-col">
            {/* Render Subfolders */}
            {subDirs.map(sub => renderFolderNode(sub, depth + 1))}
            
            {/* Render Folder Documents */}
            {folderDocs.map(doc => (
              <div
                key={doc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, doc.id)}
                onClick={() => onSelectDoc(doc.id)}
                style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
                className={`flex items-center justify-between py-1 pr-2 rounded-lg text-xs cursor-pointer ${
                  activeDocId === doc.id 
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium' 
                    : 'text-slate-650 dark:text-slate-300 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={13} className={activeDocId === doc.id ? 'text-blue-500' : 'text-slate-400'} />
                  <span className="truncate">{doc.title}</span>
                </div>
              </div>
            ))}

            {folderDocs.length === 0 && subDirs.length === 0 && (
              <span 
                style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
                className="text-[10px] text-slate-400 italic py-1"
              >
                Empty Folder
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col h-[calc(100vh-64px)] transition-colors overflow-y-auto select-none">
      
      {/* Create CTA Button Group */}
      <div className="p-4 flex flex-col gap-2">
        <button
          onClick={() => onCreateDoc('blank')}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>New Document</span>
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenTemplates}
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold py-2 rounded-xl transition-all text-xs cursor-pointer"
          >
            <Layout size={13} />
            <span>Templates</span>
          </button>
          
          <button
            onClick={handleCreateFolderClick}
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold py-2 rounded-xl transition-all text-xs cursor-pointer"
          >
            <FolderPlus size={13} />
            <span>Folder</span>
          </button>
        </div>
      </div>

      <div className="h-[1px] bg-slate-200 dark:bg-slate-800 mx-4" />

      {/* Navigation Group Container */}
      <div className="flex-1 flex flex-col gap-5 p-4 overflow-y-auto">
        
        {/* active Outline context */}
        {activeDocId && outline.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5">
              <Hash size={10} />
              <span>Document Outline</span>
            </h3>
            <div className="flex flex-col gap-0.5 max-h-[160px] overflow-y-auto pr-1">
              {outline.map((heading) => (
                <button
                  key={`${heading.index}-${heading.text}`}
                  onClick={() => onHeadingClick(heading.index)}
                  className={`w-full text-left rounded-lg text-xs py-1.5 px-2.5 transition-all truncate hover:bg-slate-250/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-350 cursor-pointer ${
                    heading.level === 1 ? 'font-semibold pl-2.5' :
                    heading.level === 2 ? 'pl-5 text-[11px]' :
                    'pl-8 text-[10px] opacity-80'
                  }`}
                  title={heading.text}
                >
                  {heading.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Folders Tree View */}
        <div>
          <div 
            onClick={() => setShowFoldersTree(!showFoldersTree)}
            className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
          >
            <span className="flex items-center gap-1.5">
              <FolderIcon size={11} />
              <span>Folders</span>
            </span>
            {showFoldersTree ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </div>

          {showFoldersTree && (
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnFolder(e, null)}
              className="flex flex-col gap-1 pr-1 min-h-[40px] rounded-lg border border-transparent hover:border-slate-200/40 dark:hover:border-slate-800/40 p-1"
            >
              {/* Render Root Level Folders */}
              {folders.filter(f => !f.parentId).map(folder => renderFolderNode(folder))}
              
              {folders.filter(f => !f.parentId).length === 0 && (
                <span className="text-[10px] text-slate-400 italic px-2">No folders created</span>
              )}
            </div>
          )}
        </div>

        {/* Files View Groups */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
            Library
          </h3>

          {/* Root Level Documents */}
          <div className="flex flex-col gap-0.5">
            {rootDocs.map(doc => (
              <div
                key={doc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, doc.id)}
                onClick={() => onSelectDoc(doc.id)}
                className={`flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-xs cursor-pointer ${
                  activeDocId === doc.id
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-250 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <FileText size={14} className={activeDocId === doc.id ? 'text-blue-500' : 'text-slate-450'} />
                <span className="truncate flex-1">{doc.title}</span>
              </div>
            ))}
            {rootDocs.length === 0 && (
              <span className="text-[10px] text-slate-450 italic px-2.5">No unorganized documents</span>
            )}
          </div>
        </div>

        {/* Shortcuts View Groups */}
        <div className="flex flex-col gap-1 mt-2">
          {/* Favorites shortcut */}
          {favoriteDocs.length > 0 && (
            <div className="flex items-center gap-2 py-1 px-2 text-xs font-semibold text-slate-700 dark:text-slate-250">
              <Heart size={13} className="text-red-500 fill-red-500/20" />
              <span>Favorites ({favoriteDocs.length})</span>
            </div>
          )}

          {/* Pinned documents shortcut */}
          {pinnedDocs.length > 0 && (
            <div className="flex items-center gap-2 py-1 px-2 text-xs font-semibold text-slate-700 dark:text-slate-250">
              <Pin size={13} className="text-amber-500 fill-amber-500/20" />
              <span>Pinned ({pinnedDocs.length})</span>
            </div>
          )}

          {/* Trashed documents shortcut */}
          {trashedDocs.length > 0 && (
            <div className="flex items-center gap-2 py-1 px-2 text-xs font-semibold text-slate-500">
              <Trash2 size={13} />
              <span>Trash ({trashedDocs.length})</span>
            </div>
          )}
        </div>

      </div>

      {/* Storage and Connection Indicators in Sidebar Footer */}
      <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/10 flex flex-col gap-3">
        {/* Status cloud connection */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-450">
          <div className="flex items-center gap-1.5">
            <Cloud size={12} className={isOnline ? 'text-green-500' : 'text-amber-500'} />
            <span>{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ backgroundColor: isOnline ? '#22c55e' : '#f59e0b' }} />
        </div>

        {/* Storage Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-450">
            <span className="flex items-center gap-1"><HardDrive size={11} /> Cloud Storage</span>
            <span>{(usedStorageBytes / (1024)).toFixed(1)} KB / 50 MB</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-1 mt-1">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 rounded-lg py-1.5 px-2.5 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-all font-semibold cursor-pointer"
          >
            <Settings size={13} />
            <span>Settings</span>
          </button>
          <button
            onClick={onOpenAbout}
            className="w-full flex items-center gap-2.5 rounded-lg py-1.5 px-2.5 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-all font-semibold cursor-pointer"
          >
            <Info size={13} />
            <span>About NovaDocs</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
