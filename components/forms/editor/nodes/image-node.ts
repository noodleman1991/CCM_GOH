import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageView } from "./image-view";

/**
 * Extends @tiptap/extension-image with the attrs the shared editor needs to
 * round-trip through Portable Text exactly as the public renderer expects:
 * caption, placement (full/start/end/center), the Sanity asset ref, and
 * image metadata (width/height/lqip) captured at upload time so the renderer
 * never has to re-fetch dimensions.
 */
export const EditorImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: "" },
      placement: { default: "full" },
      assetRef: { default: null },
      width: { default: null },
      height: { default: null },
      lqip: { default: null },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
