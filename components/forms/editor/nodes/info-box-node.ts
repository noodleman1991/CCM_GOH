import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { InfoBoxView } from "./info-box-view";

export interface InfoBoxOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    infoBox: {
      setInfoBox: (options?: { variant?: "info" | "warning" | "success" }) => ReturnType;
    };
  }
}

/**
 * Info box block node — a variant-styled callout with nested rich text
 * content (paragraphs only, matching the Sanity `infoBox.content` schema).
 * `content: "paragraph+"` keeps nesting shallow so it can't recursively embed
 * another infoBox/image/etc, mirroring the Sanity schema's restriction to
 * plain blocks.
 */
export const InfoBox = Node.create<InfoBoxOptions>({
  name: "infoBox",
  group: "block",
  content: "paragraph+",
  defining: true,
  isolating: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      variant: { default: "info" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-info-box]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-info-box": "" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBoxView);
  },

  addCommands() {
    return {
      setInfoBox:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { variant: options?.variant || "info" },
            content: [{ type: "paragraph" }],
          }),
    };
  },
});
