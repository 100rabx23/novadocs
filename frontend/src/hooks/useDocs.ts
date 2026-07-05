import { useState, useEffect, useCallback, useRef } from 'react';
import type { Document, Folder, Comment, Version, Share, TemplateId } from '../types';
import { TEMPLATES } from '../templates/presets';

const THEME_KEY = 'novadocs_theme';
const LOCAL_DOCS_KEY = 'novadocs_cached_documents';
const LOCAL_FOLDERS_KEY = 'novadocs_cached_folders';
const SYNC_QUEUE_KEY = 'novadocs_sync_queue';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'favorite' | 'pinned' | 'archived' | 'trash' | 'folderId';
  payload: any;
}

export function useDocs(accessToken: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  // Comments, Versions, and Shares for Active Document
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  
  // App UI states
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState<number>(100);
  const [zoomMode, setZoomMode] = useState<'normal' | 'fit-width' | 'fit-page'>('normal');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showTemplatesGallery, setShowTemplatesGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Offline state tracker
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const saveTimeoutRef = useRef<any>(null);

  // Load theme on initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load offline cache if exists
    const cachedDocs = localStorage.getItem(LOCAL_DOCS_KEY);
    if (cachedDocs) {
      setDocuments(JSON.parse(cachedDocs));
    }
    const cachedFolders = localStorage.getItem(LOCAL_FOLDERS_KEY);
    if (cachedFolders) {
      setFolders(JSON.parse(cachedFolders));
    }

    // Monitor Online status
    const handleOnline = () => {
      setIsOnline(true);
      triggerBackgroundSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 1. OFFLINE SYNC QUEUE HANDLERS
  const getSyncQueue = (): SyncItem[] => {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  };

  const saveSyncQueue = (queue: SyncItem[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  };

  const pushToSyncQueue = (item: SyncItem) => {
    const queue = getSyncQueue();
    // Filter duplicates for the same document and same action type
    const nextQueue = queue.filter(q => !(q.id === item.id && q.type === item.type));
    nextQueue.push(item);
    saveSyncQueue(nextQueue);
    setSaveStatus('unsaved');
  };

  const triggerBackgroundSync = async () => {
    if (!navigator.onLine || !accessToken) return;

    const queue = getSyncQueue();
    if (queue.length === 0) return;

    setSaveStatus('saving');
    for (const item of queue) {
      try {
        if (item.type === 'create') {
          await fetch(`${API_URL}/api/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify(item.payload)
          });
        } else if (item.type === 'update') {
          await fetch(`${API_URL}/api/documents/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify({ content: item.payload.content, title: item.payload.title })
          });
        } else if (item.type === 'delete') {
          await fetch(`${API_URL}/api/documents/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
        } else {
          // Meta fields (favorite, pinned, archived, trash, folderId)
          await fetch(`${API_URL}/api/documents/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify(item.payload)
          });
        }
      } catch (e) {
        console.error('Failed to sync queue action:', item, e);
        // Leave item in queue and attempt on next sync
        return;
      }
    }

    // Clean queue on success
    saveSyncQueue([]);
    setSaveStatus('saved');
    fetchDocumentsAndFolders();
  };

  // 2. CORE FETCH ALL DATA
  const fetchDocumentsAndFolders = useCallback(async () => {
    if (!accessToken) {
      setDocuments([]);
      setFolders([]);
      return;
    }

    try {
      // Fetch Docs
      const docsRes = await fetch(`${API_URL}/api/documents`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (docsRes.ok) {
        const docsData: Document[] = await docsRes.json();
        setDocuments(docsData);
        localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docsData));
      }

      // Fetch Folders
      const foldersRes = await fetch(`${API_URL}/api/documents/folders`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (foldersRes.ok) {
        const foldersData: Folder[] = await foldersRes.json();
        setFolders(foldersData);
        localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(foldersData));
      }

      // Run sync queue if online
      triggerBackgroundSync();
    } catch (err) {
      console.warn('Network unreachable. Operating in offline caching mode.', err);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDocumentsAndFolders();
  }, [fetchDocumentsAndFolders]);

  // Sync active document details
  useEffect(() => {
    if (activeDocId) {
      const found = documents.find(d => d.id === activeDocId);
      if (found) {
        setActiveDoc(found);
        // Fetch Comments, Versions, and Shares for this document
        fetchActiveDocDetails(found.id);
      } else {
        setActiveDoc(null);
      }
    } else {
      setActiveDoc(null);
    }
  }, [activeDocId, documents]);

  const fetchActiveDocDetails = async (docId: string) => {
    if (!accessToken || !navigator.onLine) return;

    try {
      // Comments
      const commRes = await fetch(`${API_URL}/api/documents/${docId}/comments`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (commRes.ok) setComments(await commRes.json());

      // Versions
      const verRes = await fetch(`${API_URL}/api/documents/${docId}/versions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (verRes.ok) setVersions(await verRes.json());

      // Shares
      const shareRes = await fetch(`${API_URL}/api/documents/${docId}/shares`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (shareRes.ok) setShares(await shareRes.json());
    } catch (e) {
      console.warn('Could not fetch active document details (offline)', e);
    }
  };

  // 3. FOLDERS ACTIONS
  const createFolder = async (name: string, parentId?: string | null) => {
    if (!accessToken || !isOnline) {
      // Offline support for folder creation in local UI
      const mockFolder: Folder = {
        id: `mock-folder-${Date.now()}`,
        name,
        parentId: parentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [mockFolder, ...folders];
      setFolders(updated);
      localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(updated));
      return mockFolder;
    }

    try {
      const res = await fetch(`${API_URL}/api/documents/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ name, parentId })
      });
      if (res.ok) {
        const newFolder = await res.json();
        setFolders(prev => [newFolder, ...prev]);
        return newFolder;
      }
    } catch (e) {
      console.error('Folder creation failed:', e);
    }
  };

  const renameFolder = async (folderId: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name, updatedAt: new Date().toISOString() } : f));
    if (!accessToken || !isOnline) return;

    try {
      await fetch(`${API_URL}/api/documents/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ name })
      });
    } catch (e) {
      console.error('Folder rename failed:', e);
    }
  };

  const deleteFolder = async (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (!accessToken || !isOnline) return;

    try {
      await fetch(`${API_URL}/api/documents/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    } catch (e) {
      console.error('Folder delete failed:', e);
    }
  };

  // 4. DOCUMENTS CRUD & META OPERATIONS
  const createDocument = useCallback(async (templateId: TemplateId = 'blank', title?: string, folderId?: string | null) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    const content = template ? template.content : '';
    const name = title || (template && template.id !== 'blank' ? `Copy of ${template.name}` : 'Untitled Document');
    const localId = `mock-doc-${Date.now()}`;

    const newLocalDoc: Document = {
      id: localId,
      title: name,
      content,
      template: templateId,
      folderId: folderId || null,
      favorite: false,
      pinned: false,
      archived: false,
      trash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update local immediately
    const updatedDocs = [newLocalDoc, ...documents];
    setDocuments(updatedDocs);
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(updatedDocs));
    setActiveDocId(localId);

    if (!accessToken || !isOnline) {
      pushToSyncQueue({ id: localId, type: 'create', payload: { title: name, content, template: templateId, folderId } });
      setShowTemplatesGallery(false);
      return newLocalDoc;
    }

    try {
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ title: name, content, template: templateId, folderId }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        // Replace mock with database doc
        setDocuments(prev => prev.map(d => d.id === localId ? newDoc : d));
        setActiveDocId(newDoc.id);
        setShowTemplatesGallery(false);
        return newDoc;
      }
    } catch (err) {
      console.error('Failed to sync new document with cloud:', err);
      pushToSyncQueue({ id: localId, type: 'create', payload: { title: name, content, template: templateId, folderId } });
    }
  }, [accessToken, documents, isOnline]);

  const updateTitle = useCallback(async (id: string, newTitle: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, title: newTitle, updatedAt: new Date().toISOString() } : d));

    if (!accessToken || !isOnline) {
      pushToSyncQueue({ id, type: 'update', payload: { title: newTitle } });
      return;
    }

    try {
      await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) {
      pushToSyncQueue({ id, type: 'update', payload: { title: newTitle } });
    }
  }, [accessToken, isOnline]);

  const updateContent = useCallback((id: string, htmlContent: string) => {
    setSaveStatus('saving');
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, content: htmlContent, updatedAt: new Date().toISOString() } : d));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const currentDoc = documents.find(d => d.id === id);
      const payload = { content: htmlContent, title: currentDoc?.title };

      if (!accessToken || !isOnline) {
        pushToSyncQueue({ id, type: 'update', payload });
        setSaveStatus('unsaved');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/documents/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ content: htmlContent }),
        });

        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('unsaved');
          pushToSyncQueue({ id, type: 'update', payload });
        }
      } catch (err) {
        setSaveStatus('unsaved');
        pushToSyncQueue({ id, type: 'update', payload });
      }
    }, 1200);
  }, [accessToken, documents, isOnline]);

  const deleteDocument = useCallback(async (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (activeDocId === id) setActiveDocId(null);

    if (!accessToken || !isOnline) {
      pushToSyncQueue({ id, type: 'delete', payload: null });
      return;
    }

    try {
      await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
    } catch (err) {
      pushToSyncQueue({ id, type: 'delete', payload: null });
    }
  }, [accessToken, activeDocId, isOnline]);

  const updateMetaField = useCallback(async (id: string, field: 'favorite' | 'pinned' | 'archived' | 'trash', value: boolean) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));

    if (!accessToken || !isOnline) {
      pushToSyncQueue({ id, type: field, payload: { [field]: value } });
      return;
    }

    try {
      await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (e) {
      pushToSyncQueue({ id, type: field, payload: { [field]: value } });
    }
  }, [accessToken, isOnline]);

  const toggleFavorite = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) updateMetaField(id, 'favorite', !doc.favorite);
  }, [documents, updateMetaField]);

  const togglePinned = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) updateMetaField(id, 'pinned', !doc.pinned);
  }, [documents, updateMetaField]);

  const toggleArchived = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) updateMetaField(id, 'archived', !doc.archived);
  }, [documents, updateMetaField]);

  const toggleTrash = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) updateMetaField(id, 'trash', !doc.trash);
  }, [documents, updateMetaField]);

  const moveDocToFolder = useCallback(async (docId: string, folderId: string | null) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, folderId } : d));
    
    if (!accessToken || !isOnline) {
      pushToSyncQueue({ id: docId, type: 'folderId', payload: { folderId } });
      return;
    }

    try {
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ folderId }),
      });
    } catch (e) {
      pushToSyncQueue({ id: docId, type: 'folderId', payload: { folderId } });
    }
  }, [accessToken, isOnline]);

  // 5. COMMENTS ACTIONS
  const addComment = async (docId: string, content: string, selection?: string) => {
    if (!accessToken || !isOnline) return;

    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ content, selection }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [...prev, comment]);
      }
    } catch (e) {
      console.error('Comment adding failed:', e);
    }
  };

  const resolveComment = async (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c));
    if (!accessToken || !isOnline) return;

    try {
      await fetch(`${API_URL}/api/auth/../documents/comments/${commentId}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    } catch (e) {
      console.error('Comment resolution failed:', e);
    }
  };

  // 6. VERSIONS SNAPSHOT ACTIONS
  const createVersionSnapshot = async (docId: string, title: string) => {
    if (!activeDoc || !accessToken || !isOnline) return;

    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ content: activeDoc.content, title }),
      });
      if (res.ok) {
        const snapshot = await res.json();
        setVersions(prev => [snapshot, ...prev]);
      }
    } catch (e) {
      console.error('Version capture failed:', e);
    }
  };

  const restoreVersionSnapshot = async (versionId: string) => {
    if (!activeDocId || !accessToken || !isOnline) return;

    try {
      const res = await fetch(`${API_URL}/api/documents/${activeDocId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const updatedDoc = await res.json();
        setDocuments(prev => prev.map(d => d.id === activeDocId ? updatedDoc : d));
        setSaveStatus('saved');
      }
    } catch (e) {
      console.error('Version restore failed:', e);
    }
  };

  // 7. SHARING ACTIONS
  const shareDoc = async (docId: string, shareData: {
    email?: string;
    role: 'viewer' | 'commenter' | 'editor';
    isPublic?: boolean;
    password?: string;
    expiresInDays?: number;
  }) => {
    if (!accessToken || !isOnline) return;

    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(shareData),
      });
      if (res.ok) {
        const share = await res.json();
        setShares(prev => [share, ...prev]);
        return share;
      }
    } catch (e) {
      console.error('Sharing setup failed:', e);
    }
  };

  const removeShare = async (docId: string, shareId: string) => {
    setShares(prev => prev.filter(s => s.id !== shareId));
    if (!accessToken || !isOnline) return;

    try {
      await fetch(`${API_URL}/api/documents/${docId}/shares/${shareId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    } catch (e) {
      console.error('Remove share failed:', e);
    }
  };

  const closeEditor = () => {
    setActiveDocId(null);
  };

  const reorderDocuments = useCallback((newOrder: Document[]) => {
    setDocuments(newOrder);
    localStorage.setItem('novadocs_ordered_ids', JSON.stringify(newOrder.map(d => d.id)));
  }, []);

  return {
    documents,
    folders,
    activeDoc,
    activeDocId,
    setActiveDocId,
    createDocument,
    updateTitle,
    updateContent,
    deleteDocument,
    closeEditor,
    reorderDocuments,
    
    // Folders
    createFolder,
    renameFolder,
    deleteFolder,
    moveDocToFolder,

    // Metadata
    toggleFavorite,
    togglePinned,
    toggleArchived,
    toggleTrash,

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
    zoomMode,
    setZoomMode,
    
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
  };
}
