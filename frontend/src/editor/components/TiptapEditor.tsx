import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

import CustomImage from '../extensions/CustomImage';
import { PageBreak } from '../extensions/PageBreak';
import { SearchReplace } from '../extensions/SearchReplace';
import { MathNode } from '../extensions/MathNode';

interface TiptapEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
  onOutlineChange?: (headings: { text: string; level: number; index: number }[]) => void;
  setEditorInstance: (editor: any) => void;
  zoom: number;
}

export default function TiptapEditor({ content, onChange, onOutlineChange, setEditorInstance, zoom }: TiptapEditorProps) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-md bg-slate-900 text-slate-100 p-4 font-mono text-sm my-4',
          },
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
      }),
      CustomImage,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Type / for commands, or start writing your document here...',
      }),
      TextStyle,
      Color,
      FontFamily,
      Subscript,
      Superscript,
      PageBreak,
      SearchReplace,
      MathNode,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      isUpdatingRef.current = true;
      onChange(html);
      isUpdatingRef.current = false;
      
      // Update outline
      if (onOutlineChange) {
        const headings: { text: string; level: number; index: number }[] = [];
        let index = 0;
        
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'heading') {
            headings.push({
              text: node.textContent,
              level: node.attrs.level,
              index: index++
            });
          }
        });
        onOutlineChange(headings);
      }
    },
  });

  // Keep track of the active instance in parent
  useEffect(() => {
    if (editor) {
      setEditorInstance(editor);
    }
  }, [editor, setEditorInstance]);



  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate zoom transform style
  const zoomStyle = {
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
    width: '816px', // Standard letter/A4 width at 96dpi
    minHeight: '1056px', // Standard letter/A4 height at 96dpi
  };

  return (
    <div className="w-full flex justify-center py-8 transition-transform duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg p-24 transition-shadow relative"
        style={zoomStyle}
      >
        <EditorContent editor={editor} className="outline-none min-h-[864px] text-slate-800 dark:text-slate-100" />
      </div>
    </div>
  );
}
