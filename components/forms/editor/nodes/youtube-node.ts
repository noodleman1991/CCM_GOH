import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { YoutubeView } from "./youtube-view";

export interface YoutubeOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtube: {
      setYoutube: (options: { videoId: string; caption?: string }) => ReturnType;
    };
  }
}

/**
 * YouTube block node — stores the parsed video id (never the raw URL) plus
 * an optional caption. Renders a thumbnail preview in the editor; the public
 * renderer already handles the consent-gated embed for the `youtube` PT type.
 */
export const Youtube = Node.create<YoutubeOptions>({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      videoId: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-youtube-video]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-youtube-video": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeView);
  },

  addCommands() {
    return {
      setYoutube:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { caption: "", ...options } }),
    };
  },
});
