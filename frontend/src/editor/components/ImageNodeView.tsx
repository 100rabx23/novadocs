import { useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Trash2, AlignLeft, AlignCenter, AlignRight, RefreshCw, Layers } from 'lucide-react';

export default function ImageNodeView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { width, height, rotation, alignment, wrap } = node.attrs;

  // Resize handler
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = imageRef.current ? imageRef.current.clientWidth : 300;
    const aspectRatio = imageRef.current ? imageRef.current.naturalWidth / imageRef.current.naturalHeight : 1.5;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = Math.max(80, startWidth + deltaX);
      
      // Keep width bounded inside editor page width
      if (newWidth > 650) newWidth = 650;

      updateAttributes({
        width: `${newWidth}px`,
        height: `${newWidth / aspectRatio}px`
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Rotation handler
  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      // Calculate angle in degrees
      let angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI) + 90; // Add 90 offset to point straight up
      
      // Snap to nearest 15 degrees if close
      if (Math.abs(angle % 15) < 5) {
        angle = Math.round(angle / 15) * 15;
      }
      
      updateAttributes({ rotation: angle });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Alignment classes
  let alignmentClass = 'justify-center';
  if (alignment === 'left') alignmentClass = 'justify-start';
  if (alignment === 'right') alignmentClass = 'justify-end';

  // Wrapping classes
  let wrapStyle: React.CSSProperties = {};
  let wrapClass = '';
  
  if (wrap === 'left') {
    wrapClass = 'float-left mr-4 mb-2';
    wrapStyle = { maxWidth: '40%' };
  } else if (wrap === 'right') {
    wrapClass = 'float-right ml-4 mb-2';
    wrapStyle = { maxWidth: '40%' };
  } else if (wrap === 'front') {
    wrapClass = 'relative z-10';
  } else if (wrap === 'behind') {
    wrapClass = 'relative z-0 opacity-60';
  }

  const rotationStyle = rotation ? { transform: `rotate(${rotation}deg)` } : {};

  return (
    <NodeViewWrapper className={`my-4 flex select-none ${alignmentClass} ${wrapClass}`} style={wrapStyle}>
      <div 
        ref={containerRef}
        className={`relative inline-block transition-shadow group ${
          selected ? 'ring-2 ring-blue-500 rounded-md shadow-lg' : 'hover:ring-1 hover:ring-slate-300 hover:rounded-md'
        }`}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || 'Document Image'}
          className="rounded-md pointer-events-none"
          style={{
            width: width || '100%',
            height: height || 'auto',
            ...rotationStyle,
          }}
        />

        {/* Resizing overlays when selected */}
        {selected && (
          <>
            {/* Resize Handles (Bottom Right corner) */}
            <div
              className="absolute bottom-[-6px] right-[-6px] w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize z-30 shadow-md hover:scale-125 transition-transform"
              onMouseDown={handleResizeMouseDown}
            />

            {/* Rotation Handle (Top Center, connected by a line) */}
            <div className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 flex flex-col items-center z-30">
              <div
                className="w-4 h-4 bg-violet-600 border-2 border-white rounded-full cursor-alias shadow-md flex items-center justify-center hover:scale-125 transition-transform"
                onMouseDown={handleRotateMouseDown}
                title="Drag to Rotate"
              >
                <RefreshCw size={8} className="text-white font-bold" />
              </div>
              <div className="w-[1px] h-3 bg-violet-400" />
            </div>

            {/* Image Inline Settings Toolbar */}
            <div className="absolute top-[8px] left-1/2 transform -translate-x-1/2 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg shadow-xl gap-1 text-slate-600 dark:text-slate-200 z-40 transition-opacity whitespace-nowrap">
              {/* Alignment Controls */}
              <button
                onClick={() => updateAttributes({ alignment: 'left' })}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${alignment === 'left' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                title="Align Left"
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => updateAttributes({ alignment: 'center' })}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${alignment === 'center' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                title="Align Center"
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => updateAttributes({ alignment: 'right' })}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${alignment === 'right' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                title="Align Right"
              >
                <AlignRight size={14} />
              </button>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

              {/* Text Wrap Controls */}
              <button
                onClick={() => updateAttributes({ wrap: wrap === 'left' ? 'inline' : 'left' })}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold px-1.5 ${wrap === 'left' ? 'bg-blue-50 text-blue-600 dark:bg-slate-700' : ''}`}
                title="Wrap Left"
              >
                Wrap L
              </button>
              <button
                onClick={() => updateAttributes({ wrap: wrap === 'right' ? 'inline' : 'right' })}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold px-1.5 ${wrap === 'right' ? 'bg-blue-50 text-blue-600 dark:bg-slate-700' : ''}`}
                title="Wrap Right"
              >
                Wrap R
              </button>
              <button
                onClick={() => updateAttributes({ wrap: wrap === 'behind' ? 'inline' : 'behind' })}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${wrap === 'behind' ? 'text-blue-600 dark:text-blue-400' : ''}`}
                title="Send Behind Text"
              >
                <Layers size={14} className="opacity-50" />
              </button>
              
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

              {/* Delete Button */}
              <button
                onClick={() => deleteNode()}
                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                title="Delete Image"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
