import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const MathNode = Node.create({
  name: 'mathNode',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      formula: {
        default: 'e = mc^2',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math-node' }), 0];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'math-node-container py-3 my-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-4 relative group';

      const renderEl = document.createElement('div');
      renderEl.className = 'math-rendered-latex text-lg text-slate-800 dark:text-slate-100';
      
      const updateMath = (formula: string) => {
        try {
          katex.render(formula || '\\text{Empty equation}', renderEl, { displayMode: true, throwOnError: false });
        } catch (e) {
          renderEl.innerHTML = `<span class="text-red-500 font-semibold">${e}</span>`;
        }
      };

      updateMath(node.attrs.formula);

      const input = document.createElement('input');
      input.className = 'math-formula-input mt-2 px-3 py-1 border border-slate-250 dark:border-slate-800 rounded text-xs w-full max-w-md bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hidden group-hover:block focus:block';
      input.value = node.attrs.formula;
      input.placeholder = 'Type LaTeX formula (e.g. \\int f(x) dx)';
      
      input.addEventListener('input', (e: any) => {
        const val = e.target.value;
        updateMath(val);
        if (typeof getPos === 'function' && editor.isEditable) {
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(getPos() as number, undefined, {
              ...node.attrs,
              formula: val,
            });
            return true;
          });
        }
      });

      dom.appendChild(renderEl);
      dom.appendChild(input);

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          input.value = updatedNode.attrs.formula;
          updateMath(updatedNode.attrs.formula);
          return true;
        },
      };
    };
  },
});
