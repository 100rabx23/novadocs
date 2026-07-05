import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { 
  Undo, Redo, Bold, Italic, Underline, Strikethrough, 
  Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Table as TableIcon, Image as ImageIcon,
  Link as LinkIcon, Download, Minus, FilePlus, ChevronDown, Smile
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onExport: () => void;
}

const FONTS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
  { label: 'System', value: 'system-ui' },
  { label: 'Monospace', value: 'monospace' }
];

const COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Dark Slate', value: '#1E293B' }
];

const HIGHLIGHTS = [
  { name: 'None', value: 'transparent' },
  { name: 'Yellow', value: '#FEF08A' },
  { name: 'Green', value: '#BBF7D0' },
  { name: 'Blue', value: '#BFDBFE' },
  { name: 'Pink', value: '#FBCFE8' },
  { name: 'Purple', value: '#E9D5FF' }
];

export default function EditorToolbar({ editor, onExport }: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    
    // cancelled
    if (url === null) return;
    
    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    setShowTableMenu(false);
  };

  const addEmoji = () => {
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🫨', '🫠', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🫥', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '🦧', '🦍', '🦮', '🐕', '🐈', '🦁', '🐅', '🐆', '🐎', '🦌', '🦬', '🐂', '🐃', '🐄', '🐷', '🐏', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐰', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦫', '✨', '🔥', '🎉', '🚀', '❤️', '💡', '✅', '❌'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    editor.chain().focus().insertContent(randomEmoji).run();
  };

  return (
    <div className="flex flex-wrap items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 gap-1 sticky top-0 z-20 shadow-sm transition-colors overflow-x-auto">
      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-all"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo size={16} />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Font Family Menu */}
      <div className="relative">
        <button
          onClick={() => setShowFontMenu(!showFontMenu)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all"
          title="Change Font Family"
        >
          <span>Font</span>
          <ChevronDown size={12} />
        </button>
        {showFontMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-30 min-w-[140px]">
            {FONTS.map(f => (
              <button
                key={f.value}
                onClick={() => {
                  editor.chain().focus().setFontFamily(f.value).run();
                  setShowFontMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Formatting Tools */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('bold') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('italic') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('underline') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('strike') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Colors & Highlights */}
      <div className="flex items-center gap-1 relative">
        {/* Text Color Picker */}
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-0.5"
          title="Text Color"
        >
          <span className="font-semibold text-sm border-b-2 border-red-500 px-0.5">A</span>
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-2 z-30 grid grid-cols-3 gap-1 min-w-[120px]">
            {COLORS.map(c => (
              <button
                key={c.name}
                onClick={() => {
                  if (c.value === 'inherit') {
                    editor.chain().focus().unsetColor().run();
                  } else {
                    editor.chain().focus().setColor(c.value).run();
                  }
                  setShowColorPicker(false);
                }}
                className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <div className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: c.value === 'inherit' ? 'transparent' : c.value }} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Highlight Color Picker */}
        <button
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
          title="Highlight Text"
        >
          <Highlighter size={16} />
        </button>
        {showHighlightPicker && (
          <div className="absolute top-full left-6 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-2 z-30 grid grid-cols-3 gap-1 min-w-[120px]">
            {HIGHLIGHTS.map(h => (
              <button
                key={h.name}
                onClick={() => {
                  if (h.value === 'transparent') {
                    editor.chain().focus().unsetHighlight().run();
                  } else {
                    editor.chain().focus().setHighlight({ color: h.value }).run();
                  }
                  setShowHighlightPicker(false);
                }}
                className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-left text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <div className="w-3 h-3 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: h.value }} />
                <span>{h.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Alignments */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Justify"
        >
          <AlignJustify size={16} />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('bulletList') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('orderedList') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('taskList') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Task Checklist"
        >
          <CheckSquare size={16} />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Inserts & Tables */}
      <div className="flex items-center gap-0.5 relative">
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          onClick={addLink}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            editor.isActive('link') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Insert/Edit Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          onClick={addEmoji}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
          title="Random Emoji"
        >
          <Smile size={16} />
        </button>
        
        {/* Table Options Dropdown */}
        <button
          onClick={() => {
            setShowTableMenu(!showTableMenu);
            setShowColorPicker(false);
            setShowHighlightPicker(false);
          }}
          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-0.5 ${
            editor.isActive('table') ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : ''
          }`}
          title="Table Operations"
        >
          <TableIcon size={16} />
          <ChevronDown size={10} />
        </button>
        {showTableMenu && (
          <div className="absolute top-full left-10 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1.5 z-30 min-w-[160px] text-xs text-slate-700 dark:text-slate-200">
            <button onClick={insertTable} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
              <span>Insert 3x3 Table</span>
            </button>
            {editor.isActive('table') && (
              <>
                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
                <button onClick={() => editor.chain().focus().addRowAfter().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Add Row Below</button>
                <button onClick={() => editor.chain().focus().addRowBefore().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Add Row Above</button>
                <button onClick={() => editor.chain().focus().deleteRow().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500">Delete Row</button>
                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
                <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Add Column Right</button>
                <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Add Column Left</button>
                <button onClick={() => editor.chain().focus().deleteColumn().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500">Delete Column</button>
                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
                <button onClick={() => editor.chain().focus().mergeCells().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Merge Cells</button>
                <button onClick={() => editor.chain().focus().splitCell().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">Split Cells</button>
                <button onClick={() => editor.chain().focus().deleteTable().run()} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 font-medium">Delete Table</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Dividers & Page Breaks */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
          title="Horizontal Divider"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setPageBreak().run()}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
          title="Insert Page Break"
        >
          <FilePlus size={16} />
        </button>
      </div>

      {/* Export Action */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Export as Microsoft Word DOCX"
        >
          <Download size={14} />
          <span>Export DOCX</span>
        </button>
      </div>
    </div>
  );
}
