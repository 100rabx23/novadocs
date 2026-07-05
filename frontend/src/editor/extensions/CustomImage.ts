import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from '../components/ImageNodeView';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      height: {
        default: 'auto',
        renderHTML: attributes => ({
          height: attributes.height,
        }),
      },
      rotation: {
        default: 0,
        renderHTML: attributes => ({
          style: `transform: rotate(${attributes.rotation}deg);`,
          'data-rotation': attributes.rotation,
        }),
      },
      alignment: {
        default: 'center',
        renderHTML: attributes => ({
          'data-alignment': attributes.alignment,
        }),
      },
      wrap: {
        default: 'inline',
        renderHTML: attributes => ({
          'data-wrap': attributes.wrap,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
export default CustomImage;
