import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, 
  Quote, Code, Minus, FilePlus, Table, Image as ImageIcon
} from 'lucide-react';

interface SlashCommandsMenuProps {
  editor: Editor | null;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  action: (editor: Editor) => void;
}

const COMMANDS: CommandItem[] = [
  {
    id: 'h1',
    title: 'Heading 1',
    subtitle: 'Big section heading',
    icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    id: 'h2',
    title: 'Heading 2',
    subtitle: 'Medium section heading',
    icon: Heading2,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    id: 'h3',
    title: 'Heading 3',
    subtitle: 'Small section heading',
    icon: Heading3,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    id: 'bullet',
    title: 'Bullet List',
    subtitle: 'Simple bulleted list',
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    id: 'numbered',
    title: 'Numbered List',
    subtitle: 'Ordered list of items',
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run()
  },
  {
    id: 'todo',
    title: 'Todo List',
    subtitle: 'Checklist of tasks',
    icon: CheckSquare,
    action: (editor) => editor.chain().focus().toggleTaskList().run()
  },
  {
    id: 'quote',
    title: 'Blockquote',
    subtitle: 'Insert a blockquote quote',
    icon: Quote,
    action: (editor) => editor.chain().focus().toggleBlockquote().run()
  },
  {
    id: 'code',
    title: 'Code Block',
    subtitle: 'Monospaced code block',
    icon: Code,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run()
  },
  {
    id: 'divider',
    title: 'Horizontal Line',
    subtitle: 'Visual dividing line',
    icon: Minus,
    action: (editor) => editor.chain().focus().setHorizontalRule().run()
  },
  {
    id: 'pagebreak',
    title: 'Page Break',
    subtitle: 'Insert an A4 page break',
    icon: FilePlus,
    action: (editor) => editor.chain().focus().setPageBreak().run()
  },
  {
    id: 'table',
    title: 'Insert Table',
    subtitle: 'Insert a 3x3 layout table',
    icon: Table,
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  },
  {
    id: 'image',
    title: 'Insert Image',
    subtitle: 'Upload or insert an image url',
    icon: ImageIcon,
    action: (editor) => {
      const url = window.prompt('Enter Image URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  },
  {
    id: 'math',
    title: 'Math Formula',
    subtitle: 'LaTeX mathematical formula block',
    icon: FilePlus,
    action: (editor) => {
      editor.chain().focus().insertContent({ type: 'mathNode', attrs: { formula: 'e = mc^2' } }).run();
    }
  }
];

export default function SlashCommandsMenu({ editor }: SlashCommandsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerPosRef = useRef<number>(-1);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If menu is open, handle navigation keys
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filtered.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (filtered[selectedIndex]) {
            executeCommand(filtered[selectedIndex]);
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closeMenu();
          return;
        }
      }

      // 2. Open trigger: typing '/' after a space or at start of line
      if (e.key === '/') {
        const { selection } = editor.state;
        const textBefore = editor.state.doc.textBetween(Math.max(0, selection.from - 1), selection.from);
        
        // Only open if typed at start of doc or after space
        if (selection.from === 1 || textBefore === ' ' || textBefore === '\n') {
          triggerPosRef.current = selection.from;
          
          // Calculate screen coordinates
          const domCoords = editor.view.coordsAtPos(selection.from);
          // Position below cursor
          setCoords({
            top: domCoords.bottom + window.scrollY,
            left: domCoords.left + window.scrollX
          });
          setIsOpen(true);
          setQuery('');
          setSelectedIndex(0);
        }
      }
    };

    const handleSelectionChange = () => {
      if (!isOpen || !editor) return;

      const { selection } = editor.state;
      // Close if cursor moves back before trigger or too far forward
      if (selection.from < triggerPosRef.current || selection.from > triggerPosRef.current + 20) {
        closeMenu();
        return;
      }

      // Extract query typed after the '/'
      try {
        const text = editor.state.doc.textBetween(triggerPosRef.current, selection.from);
        setQuery(text);
      } catch (err) {
        closeMenu();
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);
    
    // Use capture phase to intercept keys before prosemirror handles them
    editor.view.dom.addEventListener('keydown', handleKeyDown, true);

    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
      if (editor.view?.dom) {
        editor.view.dom.removeEventListener('keydown', handleKeyDown, true);
      }
    };
  }, [editor, isOpen, selectedIndex, query]);

  const closeMenu = () => {
    setIsOpen(false);
    triggerPosRef.current = -1;
  };

  const executeCommand = (cmd: CommandItem) => {
    if (!editor) return;

    // Delete query string including the slash
    const { selection } = editor.state;
    editor.chain()
      .focus()
      .deleteRange({ from: triggerPosRef.current - 1, to: selection.from })
      .run();

    // Run action
    cmd.action(editor);
    closeMenu();
  };

  const filtered = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div 
      className="absolute bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col max-h-[280px] w-64 overflow-y-auto"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`
      }}
    >
      <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 mb-1 select-none">
        Slash Commands
      </div>
      {filtered.map((cmd, i) => {
        const Icon = cmd.icon;
        const isSelected = i === selectedIndex;
        return (
          <button
            key={cmd.id}
            onClick={() => executeCommand(cmd)}
            onMouseEnter={() => setSelectedIndex(i)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left select-none outline-none ${
              isSelected 
                ? 'bg-blue-600 text-white font-semibold' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-md ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <Icon size={14} />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs truncate">{cmd.title}</span>
              <span className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{cmd.subtitle}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
