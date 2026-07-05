import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchTerm: (term: string) => ReturnType;
      replace: (replaceText: string) => ReturnType;
      replaceAll: (replaceText: string) => ReturnType;
      nextSearchMatch: () => ReturnType;
      prevSearchMatch: () => ReturnType;
    };
  }
}

interface SearchReplaceOptions {
  searchTerm: string;
  replaceTerm: string;
  caseSensitive: boolean;
}

export const SearchReplace = Extension.create<SearchReplaceOptions>({
  name: 'searchReplace',

  addOptions() {
    return {
      searchTerm: '',
      replaceTerm: '',
      caseSensitive: false,
    };
  },

  addStorage() {
    return {
      searchTerm: '',
      replaceTerm: '',
      caseSensitive: false,
      results: [] as { from: number; to: number }[],
      currentIndex: -1,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ editor }: any) => {
          this.options.searchTerm = term;
          this.storage.searchTerm = term;
          
          // Re-trigger search calculation
          editor.view.dispatch(editor.state.tr.setMeta('searchReplaceChange', true));
          return true;
        },
      replace:
        (replaceText: string) =>
        ({ editor, dispatch }: any) => {
          const results = this.storage.results;
          const index = this.storage.currentIndex;
          if (results.length === 0 || index < 0 || index >= results.length) {
            return false;
          }

          const match = results[index];
          if (dispatch) {
            const tr = editor.state.tr.insertText(replaceText, match.from, match.to);
            dispatch(tr);
            
            // Adjust current index
            this.storage.currentIndex = results.length > 1 ? (index) % (results.length - 1) : -1;
          }
          return true;
        },
      replaceAll:
        (replaceText: string) =>
        ({ editor, dispatch }: any) => {
          const results = this.storage.results;
          if (results.length === 0) return false;

          if (dispatch) {
            let tr = editor.state.tr;
            // Iterate in reverse to avoid offset shift issues
            for (let i = results.length - 1; i >= 0; i--) {
              const match = results[i];
              tr = tr.insertText(replaceText, match.from, match.to);
            }
            dispatch(tr);
            this.storage.currentIndex = -1;
            this.storage.results = [];
          }
          return true;
        },
      nextSearchMatch:
        () =>
        ({ editor }: any) => {
          const results = this.storage.results;
          const index = this.storage.currentIndex;
          if (results.length === 0) return false;
          
          this.storage.currentIndex = (index + 1) % results.length;
          editor.view.dispatch(editor.state.tr.setMeta('searchReplaceChange', true));
          return true;
        },
      prevSearchMatch:
        () =>
        ({ editor }: any) => {
          const results = this.storage.results;
          const index = this.storage.currentIndex;
          if (results.length === 0) return false;
          
          this.storage.currentIndex = (index - 1 + results.length) % results.length;
          editor.view.dispatch(editor.state.tr.setMeta('searchReplaceChange', true));
          return true;
        },
    } as any;
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey('searchReplace'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            const isChange = tr.getMeta('searchReplaceChange');
            const hasDocChanged = tr.docChanged;

            if (!isChange && !hasDocChanged) {
              return oldState.map(tr.mapping, tr.doc);
            }

            const term = extension.storage.searchTerm;
            if (!term) {
              extension.storage.results = [];
              extension.storage.currentIndex = -1;
              return DecorationSet.empty;
            }

            const results: { from: number; to: number }[] = [];
            
            // Find matches using text traversal
            tr.doc.descendants((node, pos) => {
              if (node.isText) {
                const nodeText = node.text || '';
                let index = 0;
                const searchStr = extension.options.caseSensitive ? term : term.toLowerCase();
                const textStr = extension.options.caseSensitive ? nodeText : nodeText.toLowerCase();

                while ((index = textStr.indexOf(searchStr, index)) !== -1) {
                  results.push({
                    from: pos + index,
                    to: pos + index + searchStr.length,
                  });
                  index += searchStr.length;
                }
              }
            });

            extension.storage.results = results;
            if (extension.storage.currentIndex === -1 && results.length > 0) {
              extension.storage.currentIndex = 0;
            } else if (results.length === 0) {
              extension.storage.currentIndex = -1;
            }

            // Map decorations
            const decorations = results.map((match, i) => {
              const isActive = i === extension.storage.currentIndex;
              return Decoration.inline(match.from, match.to, {
                class: isActive 
                  ? 'bg-yellow-400 text-black border border-amber-500 rounded px-[2px] font-medium' 
                  : 'bg-yellow-100 text-black border border-yellow-200 rounded px-[2px]',
              });
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
