import { useState } from 'react';
import { 
  Sparkles, MessageSquare, History, Share2, Plus, Check, Send, UserMinus, 
  ShieldCheck, ChevronRight, RefreshCcw
} from 'lucide-react';
import type { Comment, Version, Share } from '../../types';

interface EditorRightSidebarProps {
  docId: string;
  comments: Comment[];
  onAddComment: (docId: string, content: string, selection?: string) => void;
  onResolveComment: (id: string) => void;
  versions: Version[];
  onCreateVersion: (docId: string, title: string) => void;
  onRestoreVersion: (id: string) => void;
  shares: Share[];
  onShareDoc: (docId: string, data: any) => Promise<any>;
  onRemoveShare: (docId: string, id: string) => void;
  editor: any; // Tiptap editor instance
}

type TabType = 'ai' | 'comments' | 'versions' | 'sharing';

export default function EditorRightSidebar({
  docId,
  comments,
  onAddComment,
  onResolveComment,
  versions,
  onCreateVersion,
  onRestoreVersion,
  shares,
  onShareDoc,
  onRemoveShare,
  editor,
}: EditorRightSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ai');

  // AI Assistant States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Comments States
  const [commentText, setCommentText] = useState('');

  // Version States
  const [versionTitle, setVersionTitle] = useState('');

  // Sharing States
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'commenter' | 'editor'>('viewer');
  const [isPublic, setIsPublic] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const shareExpiresDays = 7;
  const [generatedPublicLink, setGeneratedPublicLink] = useState<string | null>(null);

  // AI Prompt Templates
  const handleAIAction = async (type: 'summarize' | 'improve' | 'extend') => {
    if (!editor) return;
    setAiLoading(true);
    setAiOutput('');

    const documentText = editor.getText();
    if (!documentText.trim()) {
      setAiOutput('Document is empty. Add some text first!');
      setAiLoading(false);
      return;
    }

    // Mock AI generator with streaming simulated effect
    let rawText = '';
    if (type === 'summarize') {
      rawText = `### Document Summary\nThis document details the main deliverables and structural elements of the active project file. It covers key parameters, highlights objectives, and establishes roadmap constraints.`;
    } else if (type === 'improve') {
      rawText = `Improving grammar & style... Here is a cleaner version: [Grammar improved successfully. Key typographic hierarchies, paragraph flow, and semantic phrasing have been optimized for corporate reading styles.]`;
    } else {
      rawText = `Expanding concepts... [Added context: To ensure the success of this deliverable, teams must coordinate across three primary tracks: resource scaling, API validation pipelines, and frontend accessibility reviews.]`;
    }

    let i = 0;
    const interval = setInterval(() => {
      setAiOutput(prev => prev + rawText.charAt(i));
      i++;
      if (i >= rawText.length) {
        clearInterval(interval);
        setAiLoading(false);
      }
    }, 15);
  };

  const handleCustomAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiOutput('');

    const responses = [
      "Here is the restructured paragraph mapping your goals:",
      "Based on your input, I suggest organizing this section with headers:",
      "Here is an expanded draft incorporating your notes:"
    ];
    const prefix = responses[Math.floor(Math.random() * responses.length)];
    const rawText = `${prefix}\n\n"${aiPrompt}" -> [AI Suggestion: Process outline successfully structured. Click 'Insert into doc' to append this analysis directly at cursor position.]`;

    let i = 0;
    const interval = setInterval(() => {
      setAiOutput(prev => prev + rawText.charAt(i));
      i++;
      if (i >= rawText.length) {
        clearInterval(interval);
        setAiLoading(false);
        setAiPrompt('');
      }
    }, 15);
  };

  const handleInsertAIOutput = () => {
    if (editor && aiOutput) {
      editor.chain().focus().insertContent(`<p><strong>AI Assistant:</strong> ${aiOutput.replace(/\n/g, '<br/>')}</p>`).run();
      setAiOutput('');
    }
  };

  // Add comment with selection highlight context
  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    let selectionContext = undefined;
    if (editor) {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        selectionContext = editor.state.doc.textBetween(from, to);
      }
    }

    onAddComment(docId, commentText, selectionContext);
    setCommentText('');
  };

  // Share Document trigger
  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() && !isPublic) return;

    const payload = isPublic 
      ? { isPublic: true, password: sharePassword || undefined, expiresInDays: shareExpiresDays, role: 'viewer' }
      : { email: inviteEmail, role: inviteRole };

    const res = await onShareDoc(docId, payload);
    if (res) {
      setInviteEmail('');
      if (isPublic && res.token) {
        setGeneratedPublicLink(`http://localhost:5173/share/${res.token}`);
      }
    }
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTitle.trim()) return;
    onCreateVersion(docId, versionTitle);
    setVersionTitle('');
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden select-none transition-colors">
      
      {/* Sidebar Tabs */}
      <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-850 p-1 bg-slate-50 dark:bg-slate-900/60">
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${activeTab === 'ai' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-650'}`}
          title="AI Assistant"
        >
          <Sparkles size={14} />
          <span>AI</span>
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${activeTab === 'comments' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-650'}`}
          title="Comments"
        >
          <MessageSquare size={14} />
          <span>Comments</span>
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${activeTab === 'versions' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-650'}`}
          title="Version History"
        >
          <History size={14} />
          <span>Versions</span>
        </button>
        <button
          onClick={() => setActiveTab('sharing')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${activeTab === 'sharing' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-650'}`}
          title="Sharing Permissions"
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* TAB 1: AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Quick Tools</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleAIAction('summarize')}
                  className="py-2 px-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Summarize
                </button>
                <button 
                  onClick={() => handleAIAction('improve')}
                  className="py-2 px-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Fix Style
                </button>
                <button 
                  onClick={() => handleAIAction('extend')}
                  className="py-2 px-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Expand
                </button>
              </div>
            </div>

            <form onSubmit={handleCustomAISubmit} className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-850 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ask AI Prompt</span>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI to rewrite, edit, or create templates..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-250 outline-none focus:border-blue-500 font-medium resize-none"
              />
              <button 
                type="submit"
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={13} />
                <span>Submit Prompt</span>
              </button>
            </form>

            {/* AI Output Result Box */}
            {(aiLoading || aiOutput) && (
              <div className="flex flex-col gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  <span className="flex items-center gap-1"><Sparkles size={11} className="animate-spin" /> AI Suggestion</span>
                  {aiLoading && <span className="animate-pulse">Thinking...</span>}
                </div>
                
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                  {aiOutput}
                </p>

                {!aiLoading && aiOutput && (
                  <button 
                    onClick={handleInsertAIOutput}
                    className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 cursor-pointer"
                  >
                    <span>Insert into document</span>
                    <ChevronRight size={11} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMMENTS */}
        {activeTab === 'comments' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Add Comment */}
            <form onSubmit={handleAddCommentSubmit} className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Comment</span>
              
              {editor && editor.state.selection.from !== editor.state.selection.to && (
                <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-500 font-semibold italic truncate">
                  Highlight: "{editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)}"
                </div>
              )}

              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type comment..."
                  className="w-full text-xs pl-3 pr-9 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Send size={12} />
                </button>
              </div>
            </form>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-850 my-2" />

            {/* Comments List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Comments</span>
              {comments.filter(c => !c.resolved).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No unresolved comments.</span>
              ) : (
                comments.filter(c => !c.resolved).map(comment => (
                  <div key={comment.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {comment.user?.displayName || 'User'}
                      </span>
                      <button 
                        onClick={() => onResolveComment(comment.id)}
                        className="p-1 rounded bg-white dark:bg-slate-950 hover:bg-green-50 hover:text-green-600 border border-slate-200 dark:border-slate-850 text-slate-400"
                        title="Resolve comment"
                      >
                        <Check size={11} />
                      </button>
                    </div>
                    
                    {comment.selection && (
                      <div className="text-[10px] font-semibold text-slate-450 border-l-2 border-slate-350 dark:border-slate-700 pl-2 py-0.5 italic">
                        "{comment.selection}"
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VERSIONS HISTORY */}
        {activeTab === 'versions' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Create manually */}
            <form onSubmit={handleCreateSnapshot} className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Save Version Snapshot</span>
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={versionTitle}
                  onChange={(e) => setVersionTitle(e.target.value)}
                  placeholder="Snapshot label..."
                  className="w-full text-xs pl-3 pr-9 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!versionTitle.trim()}
                  className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Plus size={12} />
                </button>
              </div>
            </form>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-850 my-2" />

            {/* Versions List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History Logs</span>
              {versions.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No saved version snapshots.</span>
              ) : (
                versions.map(ver => (
                  <div 
                    key={ver.id}
                    className="border border-slate-205 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-3 flex flex-col gap-1 bg-white dark:bg-slate-900 group/version cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[130px]">{ver.title}</span>
                      <button 
                        onClick={() => onRestoreVersion(ver.id)}
                        className="opacity-0 group-hover/version:opacity-100 flex items-center gap-0.5 text-[9px] font-bold bg-blue-600 text-white py-1 px-2 rounded-lg hover:opacity-90"
                        title="Restore this state"
                      >
                        <RefreshCcw size={10} />
                        <span>Restore</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mt-1">
                      <span>{ver.user?.displayName || 'Editor'}</span>
                      <span>{new Date(ver.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SHARING PERMISSIONS */}
        {activeTab === 'sharing' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            
            {/* Direct User Invitation */}
            <form onSubmit={handleShareSubmit} className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invite Collaborator</span>
              <input 
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborator@email.com"
                className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-medium"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="text-xs p-2 border border-slate-250 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 outline-none flex-1 font-semibold"
                >
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                </select>
                
                <button 
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </form>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-850 my-2" />

            {/* Public Link Generator */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Sharing Link</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-200 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    if (!e.target.checked) setGeneratedPublicLink(null);
                  }}
                  className="rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Guest Public Access Link</span>
              </label>

              {isPublic && (
                <div className="flex flex-col gap-2 animate-in fade-in">
                  <input 
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Guest access password (optional)"
                    className="w-full text-xs p-2 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-medium"
                  />
                  <button 
                    onClick={handleShareSubmit}
                    className="w-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  >
                    Generate Link URL
                  </button>
                </div>
              )}

              {generatedPublicLink && (
                <div className="flex flex-col gap-1.5 p-2.5 bg-green-50/50 dark:bg-green-950/10 border border-green-200/40 dark:border-green-900/30 rounded-xl text-[10px] text-green-700 dark:text-green-450 animate-in zoom-in-95">
                  <span className="font-bold flex items-center gap-1"><ShieldCheck size={12}/> Public Link Generated:</span>
                  <span className="font-mono break-all select-all bg-white dark:bg-slate-950 p-2 border border-green-100 dark:border-green-900/50 rounded-lg cursor-pointer">
                    {generatedPublicLink}
                  </span>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-850 my-2" />

            {/* Active Shares List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Shares ({shares.length})</span>
              {shares.map(share => (
                <div key={share.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-2.5 rounded-xl text-xs font-semibold">
                  <div className="flex flex-col truncate max-w-[150px]">
                    <span className="text-slate-750 dark:text-slate-200 truncate">{share.user?.displayName || share.email || 'Guest User'}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{share.role}</span>
                  </div>
                  <button 
                    onClick={() => onRemoveShare(docId, share.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg"
                    title="Remove access"
                  >
                    <UserMinus size={13} />
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
