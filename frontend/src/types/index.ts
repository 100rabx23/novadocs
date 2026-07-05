export interface Document {
  id: string;
  title: string;
  content: string; // HTML string from Tiptap editor
  createdAt: string;
  updatedAt: string;
  template?: string; // template ID if created from one
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  trash?: boolean;
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
  subfolders?: Folder[];
}

export interface Version {
  id: string;
  documentId: string;
  content: string;
  title: string;
  createdAt: string;
  userId: string;
  user?: {
    displayName?: string;
  };
}

export interface Share {
  id: string;
  documentId: string;
  sharedWithId?: string | null;
  email?: string | null;
  role: 'viewer' | 'commenter' | 'editor' | 'owner';
  isPublic: boolean;
  token: string;
  expiresAt?: string | null;
  createdAt: string;
  user?: {
    email: string;
    displayName: string;
  };
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  selection?: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    displayName: string;
    avatar?: string;
  };
}

export type TemplateId = 'blank' | 'resume-modern' | 'resume-ats' | 'resume-creative' | 'invoice-business' | 'invoice-agency' | 'invoice-freelancer' | 'report-business' | 'report-college' | 'report-project';

export interface DocumentTemplate {
  id: TemplateId;
  name: string;
  category: 'Blank' | 'Resume' | 'Invoice' | 'Report';
  description: string;
  icon: string;
  content: string;
}

export interface SearchReplaceState {
  findText: string;
  replaceText: string;
  isOpen: boolean;
  matchCase: boolean;
  activeIndex: number;
  totalMatches: number;
}
